package com.conduit.pipeline;

import com.conduit.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Pipeline CRUD business logic.
 */
@Service
public class PipelineService {

    private static final Logger log = LoggerFactory.getLogger(PipelineService.class);
    private static final String PIPELINES_PATH = "pipelines";

    private final StorageService storageService;

    public PipelineService(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * List all pipelines.
     */
    public List<Pipeline> list() {
        return storageService.readList(PIPELINES_PATH, Pipeline.class);
    }

    /**
     * Find a pipeline by ID.
     */
    public Optional<Pipeline> findById(String id) {
        return list().stream()
                .filter(p -> p.getId().equals(id))
                .findFirst();
    }

    /**
     * Create a new pipeline.
     */
    public Pipeline create(Pipeline input, String createdBy) {
        List<Pipeline> pipelines = new ArrayList<>(storageService.readList(PIPELINES_PATH, Pipeline.class));

        // Check duplicate name
        boolean exists = pipelines.stream().anyMatch(p -> p.getName().equalsIgnoreCase(input.getName()));
        if (exists) {
            throw new PipelineException("Pipeline '" + input.getName() + "' already exists");
        }

        if (input.getName() == null || input.getName().isBlank()) {
            throw new PipelineException("Pipeline name is required");
        }

        Pipeline pipeline = new Pipeline(
                input.getName(),
                input.getDescription(),
                input.getRepoUrl(),
                input.getBranch(),
                input.getDefinitionType() != null ? input.getDefinitionType() : DefinitionType.FREESTYLE,
                input.getTrigger() != null ? input.getTrigger() : TriggerType.MANUAL,
                createdBy
        );

        // Copy definition-type-specific fields
        pipeline.setConduitFilePath(
                input.getConduitFilePath() != null ? input.getConduitFilePath() : "ConduitFile"
        );
        pipeline.setScript(input.getScript());
        pipeline.setCronExpression(input.getCronExpression());
        pipeline.setCredentialIds(input.getCredentialIds() != null ? input.getCredentialIds() : new ArrayList<>());

        // Process build steps
        if (input.getBuildSteps() != null) {
            for (int i = 0; i < input.getBuildSteps().size(); i++) {
                BuildStep step = input.getBuildSteps().get(i);
                if (step.getId() == null || step.getId().isBlank()) {
                    step.setId(UUID.randomUUID().toString());
                }
                step.setOrder(i);
            }
            pipeline.setBuildSteps(input.getBuildSteps());
        }

        // Process stages
        if (input.getStages() != null) {
            for (int i = 0; i < input.getStages().size(); i++) {
                Stage stage = input.getStages().get(i);
                if (stage.getId() == null || stage.getId().isBlank()) {
                    stage.setId(UUID.randomUUID().toString());
                }
                stage.setOrder(i);
            }
            pipeline.setStages(input.getStages());
        }

        pipelines.add(pipeline);
        storageService.write(PIPELINES_PATH, pipelines);

        log.info("Created pipeline '{}' (id: {}, type: {})", pipeline.getName(), pipeline.getId(), pipeline.getDefinitionType());
        return pipeline;
    }

    /**
     * Update an existing pipeline.
     */
    public Pipeline update(String id, Pipeline input) {
        List<Pipeline> pipelines = new ArrayList<>(storageService.readList(PIPELINES_PATH, Pipeline.class));

        Pipeline pipeline = pipelines.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new PipelineException("Pipeline not found"));

        // Check name conflict
        if (input.getName() != null && !input.getName().isBlank()
                && !input.getName().equalsIgnoreCase(pipeline.getName())) {
            boolean conflict = pipelines.stream()
                    .filter(p -> !p.getId().equals(id))
                    .anyMatch(p -> p.getName().equalsIgnoreCase(input.getName()));
            if (conflict) {
                throw new PipelineException("Pipeline '" + input.getName() + "' already exists");
            }
            pipeline.setName(input.getName());
        }

        if (input.getDescription() != null) pipeline.setDescription(input.getDescription());
        if (input.getRepoUrl() != null) pipeline.setRepoUrl(input.getRepoUrl());
        if (input.getBranch() != null) pipeline.setBranch(input.getBranch());
        if (input.getDefinitionType() != null) pipeline.setDefinitionType(input.getDefinitionType());
        if (input.getConduitFilePath() != null) pipeline.setConduitFilePath(input.getConduitFilePath());
        if (input.getScript() != null) pipeline.setScript(input.getScript());
        if (input.getTrigger() != null) pipeline.setTrigger(input.getTrigger());
        if (input.getCronExpression() != null) pipeline.setCronExpression(input.getCronExpression());
        if (input.getStatus() != null) pipeline.setStatus(input.getStatus());
        if (input.getCredentialIds() != null) pipeline.setCredentialIds(input.getCredentialIds());

        if (input.getBuildSteps() != null) {
            for (int i = 0; i < input.getBuildSteps().size(); i++) {
                BuildStep step = input.getBuildSteps().get(i);
                if (step.getId() == null || step.getId().isBlank()) {
                    step.setId(UUID.randomUUID().toString());
                }
                step.setOrder(i);
            }
            pipeline.setBuildSteps(input.getBuildSteps());
        }

        if (input.getStages() != null) {
            for (int i = 0; i < input.getStages().size(); i++) {
                Stage stage = input.getStages().get(i);
                if (stage.getId() == null || stage.getId().isBlank()) {
                    stage.setId(UUID.randomUUID().toString());
                }
                stage.setOrder(i);
            }
            pipeline.setStages(input.getStages());
        }

        pipeline.setUpdatedAt(Instant.now());
        storageService.write(PIPELINES_PATH, pipelines);

        log.info("Updated pipeline '{}' (id: {})", pipeline.getName(), id);
        return pipeline;
    }

    /**
     * Delete a pipeline by ID.
     */
    public void delete(String id) {
        List<Pipeline> pipelines = new ArrayList<>(storageService.readList(PIPELINES_PATH, Pipeline.class));
        boolean removed = pipelines.removeIf(p -> p.getId().equals(id));
        if (!removed) {
            throw new PipelineException("Pipeline not found");
        }

        storageService.write(PIPELINES_PATH, pipelines);
        log.info("Deleted pipeline (id: {})", id);
    }

    // --- Exception ---

    public static class PipelineException extends RuntimeException {
        public PipelineException(String message) {
            super(message);
        }
    }
}
