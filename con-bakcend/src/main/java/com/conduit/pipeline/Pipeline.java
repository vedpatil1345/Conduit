package com.conduit.pipeline;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Pipeline model stored in {@code pipelines.json.enc}.
 * <p>
 * Supports three definition modes (like Jenkins):
 * <ul>
 *   <li>{@code CONDUIT_FILE} — reads a ConduitFile (Groovy DSL) from the git repo</li>
 *   <li>{@code SCRIPT} — pipeline script written directly in the UI</li>
 *   <li>{@code FREESTYLE} — individual shell commands / build steps</li>
 * </ul>
 */
public class Pipeline {

    private String id;
    private String name;
    private String description;

    // --- Source repository ---
    private String repoUrl;
    private String branch;

    // --- Definition ---
    private DefinitionType definitionType;

    /** Path to ConduitFile in repo (default: "ConduitFile"). Used when definitionType = CONDUIT_FILE. */
    private String conduitFilePath;

    /** Inline pipeline script content. Used when definitionType = SCRIPT. */
    private String script;

    /** Ordered shell commands. Used when definitionType = FREESTYLE. */
    private List<BuildStep> buildSteps = new ArrayList<>();

    /** Pipeline stages (parsed from ConduitFile/script, or derived from build steps). */
    private List<Stage> stages = new ArrayList<>();

    // --- Trigger ---
    private TriggerType trigger;
    private String cronExpression;

    // --- Status ---
    private PipelineStatus status;

    // --- Credentials ---
    /** IDs of credentials this pipeline can access at runtime. */
    private List<String> credentialIds = new ArrayList<>();

    // --- Audit ---
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    public Pipeline() {
    }

    public Pipeline(String name, String description, String repoUrl, String branch,
                    DefinitionType definitionType, TriggerType trigger, String createdBy) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.description = description;
        this.repoUrl = repoUrl;
        this.branch = branch;
        this.definitionType = definitionType;
        this.trigger = trigger;
        this.conduitFilePath = "ConduitFile"; // default
        this.status = PipelineStatus.DRAFT;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRepoUrl() { return repoUrl; }
    public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public DefinitionType getDefinitionType() { return definitionType; }
    public void setDefinitionType(DefinitionType definitionType) { this.definitionType = definitionType; }

    public String getConduitFilePath() { return conduitFilePath; }
    public void setConduitFilePath(String conduitFilePath) { this.conduitFilePath = conduitFilePath; }

    public String getScript() { return script; }
    public void setScript(String script) { this.script = script; }

    public List<BuildStep> getBuildSteps() { return buildSteps; }
    public void setBuildSteps(List<BuildStep> buildSteps) { this.buildSteps = buildSteps; }

    public List<Stage> getStages() { return stages; }
    public void setStages(List<Stage> stages) { this.stages = stages; }

    public TriggerType getTrigger() { return trigger; }
    public void setTrigger(TriggerType trigger) { this.trigger = trigger; }

    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }

    public PipelineStatus getStatus() { return status; }
    public void setStatus(PipelineStatus status) { this.status = status; }

    public List<String> getCredentialIds() { return credentialIds; }
    public void setCredentialIds(List<String> credentialIds) { this.credentialIds = credentialIds; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
