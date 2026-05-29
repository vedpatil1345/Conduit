package com.conduit.run;

/**
 * Status of a pipeline run or individual stage result.
 */
public enum RunStatus {
    QUEUED,
    RUNNING,
    PASSED,
    FAILED,
    CANCELLED
}
