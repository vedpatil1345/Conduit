package com.conduit.run;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A single execution of a pipeline.
 */
public class Run {

    private String id;
    private String pipelineId;
    private String pipelineName;
    private String branch;
    private String trigger;
    private RunStatus status;
    private List<StageResult> stageResults = new ArrayList<>();
    private Instant startedAt;
    private Instant finishedAt;
    private long durationMs;
    private String triggeredBy;

    public Run() {
    }

    public Run(String pipelineId, String pipelineName, String branch, String trigger, String triggeredBy) {
        this.id = UUID.randomUUID().toString();
        this.pipelineId = pipelineId;
        this.pipelineName = pipelineName;
        this.branch = branch;
        this.trigger = trigger;
        this.status = RunStatus.QUEUED;
        this.triggeredBy = triggeredBy;
        this.startedAt = Instant.now();
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPipelineId() { return pipelineId; }
    public void setPipelineId(String pipelineId) { this.pipelineId = pipelineId; }

    public String getPipelineName() { return pipelineName; }
    public void setPipelineName(String pipelineName) { this.pipelineName = pipelineName; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getTrigger() { return trigger; }
    public void setTrigger(String trigger) { this.trigger = trigger; }

    public RunStatus getStatus() { return status; }
    public void setStatus(RunStatus status) { this.status = status; }

    public List<StageResult> getStageResults() { return stageResults; }
    public void setStageResults(List<StageResult> stageResults) { this.stageResults = stageResults; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }
}
