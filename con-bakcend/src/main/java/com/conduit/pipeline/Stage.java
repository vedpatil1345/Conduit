package com.conduit.pipeline;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * A single stage within a pipeline (e.g. "build", "test", "deploy").
 */
public class Stage {

    public enum StageType {
        BUILD, TEST, DEPLOY, CUSTOM
    }

    private String id;
    private String name;
    private StageType type;
    private String command;

    /** IDs of stages this stage depends on (must complete before this runs). */
    private List<String> dependsOn = new ArrayList<>();

    /** Position for React Flow canvas: { "x": 100, "y": 200 }. */
    private Map<String, Double> position = new HashMap<>();

    /** Execution order (0-based). */
    private int order;

    public Stage() {
    }

    public Stage(String name, StageType type, String command) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.type = type;
        this.command = command;
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public StageType getType() { return type; }
    public void setType(StageType type) { this.type = type; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public List<String> getDependsOn() { return dependsOn; }
    public void setDependsOn(List<String> dependsOn) { this.dependsOn = dependsOn; }

    public Map<String, Double> getPosition() { return position; }
    public void setPosition(Map<String, Double> position) { this.position = position; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
}
