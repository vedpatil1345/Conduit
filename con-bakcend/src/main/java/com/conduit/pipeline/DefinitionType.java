package com.conduit.pipeline;

/**
 * How a pipeline is defined — like Jenkins project types.
 */
public enum DefinitionType {
    /** Pipeline defined by a ConduitFile (Groovy DSL) in the repository. */
    CONDUIT_FILE,

    /** Pipeline script written directly in the UI. */
    SCRIPT,

    /** Freestyle project — individual shell commands / build steps. */
    FREESTYLE
}
