package com.conduit.run;

import com.conduit.pipeline.*;
import com.conduit.credential.CredentialService;
import com.conduit.storage.StorageService;
import com.conduit.config.ConduitProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Run management — trigger, list, cancel.
 * Executes stages using ProcessBuilder.
 */
@Service
public class RunService {

    private static final Logger log = LoggerFactory.getLogger(RunService.class);
    private static final String RUNS_PATH = "runs";

    private final StorageService storageService;
    private final PipelineService pipelineService;
    private final CredentialService credentialService;
    private final ConduitProperties properties;

    public RunService(StorageService storageService, PipelineService pipelineService, CredentialService credentialService, ConduitProperties properties) {
        this.storageService = storageService;
        this.pipelineService = pipelineService;
        this.credentialService = credentialService;
        this.properties = properties;
    }

    /**
     * List all runs, optionally filtered by pipelineId.
     */
    public List<Run> list(String pipelineId) {
        List<Run> runs = storageService.readList(RUNS_PATH, Run.class);
        if (pipelineId != null && !pipelineId.isBlank()) {
            runs = runs.stream().filter(r -> r.getPipelineId().equals(pipelineId)).toList();
        }
        // Sort newest first
        runs = new ArrayList<>(runs);
        runs.sort((a, b) -> {
            if (a.getStartedAt() == null) return 1;
            if (b.getStartedAt() == null) return -1;
            return b.getStartedAt().compareTo(a.getStartedAt());
        });
        return runs;
    }

    /**
     * Find a run by ID.
     */
    public Optional<Run> findById(String id) {
        return storageService.readList(RUNS_PATH, Run.class).stream()
                .filter(r -> r.getId().equals(id))
                .findFirst();
    }

    /**
     * Trigger a new pipeline run.
     */
    public Run trigger(String pipelineId, String triggeredBy) {
        Pipeline pipeline = pipelineService.findById(pipelineId)
                .orElseThrow(() -> new RunException("Pipeline not found"));

        if (pipeline.getStatus() != PipelineStatus.ACTIVE) {
            throw new RunException("Pipeline is not active — set it to ACTIVE before running");
        }

        // Build stage results from pipeline stages or build steps
        List<StageResult> stageResults = buildStageResults(pipeline);
        if (stageResults.isEmpty()) {
            throw new RunException("Pipeline has no stages or build steps to execute");
        }

        Run run = new Run(
                pipeline.getId(),
                pipeline.getName(),
                pipeline.getBranch(),
                pipeline.getTrigger() != null ? pipeline.getTrigger().name() : "MANUAL",
                triggeredBy
        );
        run.setStageResults(stageResults);

        // Persist
        List<Run> runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
        runs.add(run);
        storageService.write(RUNS_PATH, runs);

        log.info("Triggered run '{}' for pipeline '{}'", run.getId(), pipeline.getName());

        // Set pipeline status to RUNNING
        updatePipelineStatus(pipelineId, PipelineStatus.RUNNING);

        // Start async execution
        executeRunAsync(run.getId(), pipelineId);

        return run;
    }

    /**
     * Cancel a running run.
     */
    public Run cancel(String id) {
        List<Run> runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
        Run run = runs.stream().filter(r -> r.getId().equals(id)).findFirst()
                .orElseThrow(() -> new RunException("Run not found"));

        if (run.getStatus() != RunStatus.RUNNING && run.getStatus() != RunStatus.QUEUED) {
            throw new RunException("Run is not running or queued");
        }

        run.setStatus(RunStatus.CANCELLED);
        run.setFinishedAt(Instant.now());
        if (run.getStartedAt() != null) {
            run.setDurationMs(run.getFinishedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
        }

        // Cancel pending stages
        for (StageResult sr : run.getStageResults()) {
            if (sr.getStatus() == RunStatus.QUEUED || sr.getStatus() == RunStatus.RUNNING) {
                sr.setStatus(RunStatus.CANCELLED);
                sr.setFinishedAt(Instant.now());
                sr.getLogs().add("[CANCELLED]");
            }
        }

        storageService.write(RUNS_PATH, runs);

        // Restore pipeline status
        updatePipelineStatus(run.getPipelineId(), PipelineStatus.ACTIVE);

        log.info("Cancelled run '{}'", id);
        return run;
    }

    /**
     * Real stage execution asynchronously via ProcessBuilder.
     */
    @Async
    public void executeRunAsync(String runId, String pipelineId) {
        java.nio.file.Path workspacePath = null;
        try {
            // Small initial delay
            Thread.sleep(500);

            List<Run> runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
            Run run = runs.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
            if (run == null) return;

            run.setStatus(RunStatus.RUNNING);
            storageService.write(RUNS_PATH, runs);

            // Create persistent workspace per pipeline (reuse across runs)
            java.nio.file.Path baseRunsDir = java.nio.file.Paths.get(properties.getDataDir(), "data", "runs");
            java.nio.file.Files.createDirectories(baseRunsDir);
            workspacePath = baseRunsDir.resolve(pipelineId);
            java.nio.file.Files.createDirectories(workspacePath);
            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");

            for (StageResult stage : run.getStageResults()) {
                // Check cancellation
                runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
                run = runs.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
                if (run == null || run.getStatus() == RunStatus.CANCELLED) break;

                StageResult currentStage = run.getStageResults().stream()
                        .filter(s -> s.getStageId().equals(stage.getStageId()))
                        .findFirst().orElse(null);
                if (currentStage == null || currentStage.getStatus() == RunStatus.CANCELLED) continue;

                // Start stage
                currentStage.setStatus(RunStatus.RUNNING);
                currentStage.setStartedAt(Instant.now());
                
                String cmd = currentStage.getCommand() != null ? currentStage.getCommand() : "echo 'No command'";
                currentStage.getLogs().add("> " + cmd);
                currentStage.getLogs().add("[INFO] Workspace: " + workspacePath.toAbsolutePath().toString());
                storageService.write(RUNS_PATH, runs);

                // Create a temporary script file to run the command (supports multi-line)
                java.nio.file.Path tempDir = java.nio.file.Paths.get(System.getProperty("java.io.tmpdir"));
                java.nio.file.Path scriptPath = java.nio.file.Files.createTempFile(tempDir, "conduit-step-", isWindows ? ".bat" : ".sh");
                scriptPath.toFile().deleteOnExit();
                java.nio.file.Files.writeString(scriptPath, cmd);
                if (!isWindows) {
                    scriptPath.toFile().setExecutable(true);
                }

                // Setup ProcessBuilder
                ProcessBuilder pb = new ProcessBuilder();
                if (isWindows) {
                    pb.command("cmd.exe", "/c", scriptPath.toString());
                } else {
                    pb.command("sh", "-c", scriptPath.toString());
                }
                pb.directory(workspacePath.toFile());
                pb.redirectErrorStream(true);

                // Inject Credentials
                Pipeline pipeline = pipelineService.findById(pipelineId).orElse(null);
                if (pipeline != null && pipeline.getCredentialIds() != null) {
                    Map<String, String> env = pb.environment();
                    for (String credId : pipeline.getCredentialIds()) {
                        credentialService.findById(credId).ifPresent(cred -> {
                            String prefix = cred.getName().toUpperCase().replaceAll("[^A-Z0-9]", "_");
                            switch (cred.getType()) {
                                case USERNAME_PASSWORD -> {
                                    env.put(prefix + "_USR", cred.getUsername());
                                    env.put(prefix + "_PSW", cred.getPassword());
                                }
                                case SECRET_TEXT -> env.put(prefix, cred.getSecretText());
                                case TOKEN -> env.put(prefix, cred.getToken());
                                case SSH_KEY -> {
                                    env.put(prefix, cred.getSshKey());
                                    if (cred.getSshPassphrase() != null) env.put(prefix + "_PASSPHRASE", cred.getSshPassphrase());
                                }
                            }
                        });
                    }
                }

                Process process = pb.start();
                java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()));
                
                long lastWrite = System.currentTimeMillis();
                while (true) {
                    // Check cancellation during execution
                    List<Run> currentRuns = storageService.readList(RUNS_PATH, Run.class);
                    Run currentRun = currentRuns.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
                    if (currentRun != null && currentRun.getStatus() == RunStatus.CANCELLED) {
                        try {
                            process.destroyForcibly();
                        } catch (Exception ignored) {}
                        currentStage.getLogs().add("[CANCELLED] Process killed by user.");
                        break;
                    }

                    if (reader.ready()) {
                        String line = reader.readLine();
                        if (line == null) {
                            if (!process.isAlive()) break;
                        } else {
                            currentStage.getLogs().add(line);
                            // Throttle disk writes to roughly every 500ms
                            if (System.currentTimeMillis() - lastWrite > 500) {
                                // Must re-fetch run to update to avoid overwriting other changes
                                List<Run> writeRuns = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
                                Run writeRun = writeRuns.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
                                if (writeRun != null) {
                                    StageResult writeStage = writeRun.getStageResults().stream()
                                        .filter(s -> s.getStageId().equals(stage.getStageId()))
                                        .findFirst().orElse(null);
                                    if (writeStage != null) {
                                        writeStage.setLogs(new ArrayList<>(currentStage.getLogs()));
                                        storageService.write(RUNS_PATH, writeRuns);
                                        lastWrite = System.currentTimeMillis();
                                    }
                                }
                            }
                        }
                    } else {
                        if (!process.isAlive()) break;
                        Thread.sleep(50);
                    }
                }

                // Read any remaining output just in case
                while (reader.ready()) {
                    String line = reader.readLine();
                    if (line != null) currentStage.getLogs().add(line);
                }

                // Make sure process is actually dead
                while (process.isAlive()) {
                    Thread.sleep(50);
                }
                
                int exitCode = process.exitValue();
                boolean passed = (exitCode == 0);

                // Update final status for this stage
                runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
                run = runs.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
                if (run == null) return;
                currentStage = run.getStageResults().stream().filter(s -> s.getStageId().equals(stage.getStageId())).findFirst().orElse(null);
                if (currentStage == null) continue;

                if (run.getStatus() == RunStatus.CANCELLED || currentStage.getStatus() == RunStatus.CANCELLED) {
                     break; // outer loop
                }

                if (passed) {
                    currentStage.setStatus(RunStatus.PASSED);
                    currentStage.getLogs().add("[SUCCESS] Exit code 0");
                } else {
                    currentStage.setStatus(RunStatus.FAILED);
                    currentStage.getLogs().add("[ERROR] Failed with exit code " + exitCode);
                }
                currentStage.setFinishedAt(Instant.now());
                storageService.write(RUNS_PATH, runs);

                if (!passed) {
                    run.setStatus(RunStatus.FAILED);
                    run.setFinishedAt(Instant.now());
                    if (run.getStartedAt() != null) {
                        run.setDurationMs(run.getFinishedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
                    }

                    // Cancel remaining queued stages
                    boolean foundFailed = false;
                    for (StageResult sr : run.getStageResults()) {
                        if (sr.getStageId().equals(currentStage.getStageId())) {
                            foundFailed = true;
                            continue;
                        }
                        if (foundFailed && sr.getStatus() == RunStatus.QUEUED) {
                            sr.setStatus(RunStatus.CANCELLED);
                            sr.getLogs().add("[SKIPPED] Previous stage failed");
                        }
                    }
                    storageService.write(RUNS_PATH, runs);
                    updatePipelineStatus(pipelineId, PipelineStatus.ACTIVE);
                    log.info("Run '{}' FAILED at stage '{}'", runId, currentStage.getStageName());
                    break; // stop executing further stages
                }
            }

            // All stages finished successfully (or cancelled)
            runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
            run = runs.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
            if (run != null && run.getStatus() == RunStatus.RUNNING) {
                run.setStatus(RunStatus.PASSED);
                run.setFinishedAt(Instant.now());
                if (run.getStartedAt() != null) {
                    run.setDurationMs(run.getFinishedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
                }
                storageService.write(RUNS_PATH, runs);
                updatePipelineStatus(pipelineId, PipelineStatus.ACTIVE);
                log.info("Run '{}' PASSED successfully", runId);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Run '{}' execution interrupted", runId);
        } catch (Exception e) {
            log.error("Run '{}' execution error: {}", runId, e.getMessage(), e);
            try {
                List<Run> runs = new ArrayList<>(storageService.readList(RUNS_PATH, Run.class));
                Run run = runs.stream().filter(r -> r.getId().equals(runId)).findFirst().orElse(null);
                if (run != null) {
                    run.setStatus(RunStatus.FAILED);
                    run.setFinishedAt(Instant.now());
                    if (run.getStartedAt() != null) {
                        run.setDurationMs(run.getFinishedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
                    }
                    storageService.write(RUNS_PATH, runs);
                    updatePipelineStatus(pipelineId, PipelineStatus.ACTIVE);
                }
            } catch (Exception ignored) {}
        } finally {
            // Workspace cleanup removed so that all run data is stored persistently in .conduit/data/runs
            if (workspacePath != null) {
                log.info("Workspace retained at: {}", workspacePath.toAbsolutePath());
            }
        }
    }

    /**
     * Update the pipeline's status.
     */
    private void updatePipelineStatus(String pipelineId, PipelineStatus status) {
        try {
            Pipeline p = new Pipeline();
            p.setStatus(status);
            pipelineService.update(pipelineId, p);
        } catch (Exception e) {
            log.warn("Failed to update pipeline status: {}", e.getMessage());
        }
    }

    /**
     * Build StageResult list from pipeline definition.
     */
    private List<StageResult> buildStageResults(Pipeline pipeline) {
        List<StageResult> results = new ArrayList<>();

        // Prefer stages if defined
        if (pipeline.getStages() != null && !pipeline.getStages().isEmpty()) {
            List<Stage> sorted = new ArrayList<>(pipeline.getStages());
            sorted.sort(Comparator.comparingInt(Stage::getOrder));
            for (Stage stage : sorted) {
                results.add(new StageResult(stage.getId(), stage.getName(), stage.getCommand()));
            }
        }
        // Fall back to build steps
        else if (pipeline.getBuildSteps() != null && !pipeline.getBuildSteps().isEmpty()) {
            List<BuildStep> sorted = new ArrayList<>(pipeline.getBuildSteps());
            sorted.sort(Comparator.comparingInt(BuildStep::getOrder));
            for (BuildStep step : sorted) {
                results.add(new StageResult(
                        step.getId(),
                        step.getName() != null && !step.getName().isBlank() ? step.getName() : "Step " + (step.getOrder() + 1),
                        step.getCommand()
                ));
            }
        }
        // ConduitFile — checkout + parse the actual file
        else if (pipeline.getDefinitionType() == DefinitionType.CONDUIT_FILE) {
            String repo = pipeline.getRepoUrl() != null ? pipeline.getRepoUrl() : "...";
            String branch = pipeline.getBranch() != null ? pipeline.getBranch() : "main";
            String filePath = pipeline.getConduitFilePath() != null ? pipeline.getConduitFilePath() : "ConduitFile";

            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
            String checkoutCmd = isWindows ?
                    "if exist .git (\n  git fetch origin\n  git reset --hard origin/" + branch + "\n) else (\n  git clone -b " + branch + " " + repo + " .\n)" :
                    "if [ -d .git ]; then\n  git fetch origin\n  git reset --hard origin/" + branch + "\nelse\n  git clone -b " + branch + " " + repo + " .\nfi";

            results.add(new StageResult(UUID.randomUUID().toString(), "Checkout", checkoutCmd));
            results.add(new StageResult(UUID.randomUUID().toString(), "Parse " + filePath, isWindows ? "type " + filePath : "cat " + filePath));
            results.add(new StageResult(UUID.randomUUID().toString(), "Build", isWindows ? "build.bat" : "sh ./build.sh"));
            results.add(new StageResult(UUID.randomUUID().toString(), "Test", isWindows ? "test.bat" : "sh ./test.sh"));
            results.add(new StageResult(UUID.randomUUID().toString(), "Deploy", isWindows ? "deploy.bat" : "sh ./deploy.sh"));
        }
        // Script — parse the actual script content into stages
        else if (pipeline.getDefinitionType() == DefinitionType.SCRIPT) {
            String repo = pipeline.getRepoUrl() != null ? pipeline.getRepoUrl() : "...";
            String branch = pipeline.getBranch() != null ? pipeline.getBranch() : "main";
            
            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
            String checkoutCmd = isWindows ?
                    "if exist .git (\n  git fetch origin\n  git reset --hard origin/" + branch + "\n) else (\n  git clone -b " + branch + " " + repo + " .\n)" :
                    "if [ -d .git ]; then\n  git fetch origin\n  git reset --hard origin/" + branch + "\nelse\n  git clone -b " + branch + " " + repo + " .\nfi";

            // First stage: checkout
            results.add(new StageResult(UUID.randomUUID().toString(), "Checkout", checkoutCmd));

            String script = pipeline.getScript();
            if (script != null && !script.isBlank()) {
                boolean parsedDeclarative = false;
                if (script.contains("pipeline") && script.contains("stage")) {
                    Pattern pattern = Pattern.compile("stage\\s*\\(\\s*['\"](.*?)['\"]\\s*\\)\\s*\\{.*?steps\\s*\\{(.*?)\\}(?=\\s*\\}|\\s*stage)", Pattern.DOTALL);
                    java.util.regex.Matcher matcher = pattern.matcher(script);
                    while (matcher.find()) {
                        String stageName = matcher.group(1).trim();
                        String cmds = matcher.group(2).trim();
                        results.add(new StageResult(UUID.randomUUID().toString(), stageName, cmds));
                        parsedDeclarative = true;
                    }
                }

                // Fallback to line-by-line if declarative parsing found nothing
                if (!parsedDeclarative) {
                    String[] lines = script.split("\\r?\\n");
                    int stepNum = 1;
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("//") || trimmed.startsWith("#")) continue;
                        String stageName = "Step " + stepNum + ": " + (trimmed.length() > 30 ? trimmed.substring(0, 30) + "..." : trimmed);
                        results.add(new StageResult(UUID.randomUUID().toString(), stageName, trimmed));
                        stepNum++;
                    }
                }
            } else {
                results.add(new StageResult(UUID.randomUUID().toString(), "Execute Script", "echo 'No script defined'"));
            }

            // Final stage
            results.add(new StageResult(UUID.randomUUID().toString(), "Finalize", "echo 'Pipeline complete'"));
        }

        return results;
    }

    // --- Exception ---

    public static class RunException extends RuntimeException {
        public RunException(String message) {
            super(message);
        }
    }
}
