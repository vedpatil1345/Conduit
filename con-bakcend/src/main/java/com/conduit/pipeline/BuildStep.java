package com.conduit.pipeline;

import java.util.UUID;

/**
 * A single shell command / build step in a freestyle pipeline.
 */
public class BuildStep {

    private String id;
    private String name;
    private String command;
    private int order;

    public BuildStep() {
    }

    public BuildStep(String name, String command) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.command = command;
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
}
