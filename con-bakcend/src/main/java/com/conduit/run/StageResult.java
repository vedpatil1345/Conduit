package com.conduit.run;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Result of a single stage execution within a run.
 */
public class StageResult {

    private String stageId;
    private String stageName;
    private String command;
    private RunStatus status;
    private Instant startedAt;
    private Instant finishedAt;
    private List<String> logs = new ArrayList<>();

    public StageResult() {
    }

    public StageResult(String stageId, String stageName, String command) {
        this.stageId = stageId;
        this.stageName = stageName;
        this.command = command;
        this.status = RunStatus.QUEUED;
    }

    // --- Getters & Setters ---

    public String getStageId() { return stageId; }
    public void setStageId(String stageId) { this.stageId = stageId; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public RunStatus getStatus() { return status; }
    public void setStatus(RunStatus status) { this.status = status; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }

    public List<String> getLogs() { return logs; }
    public void setLogs(List<String> logs) { this.logs = logs; }
}
