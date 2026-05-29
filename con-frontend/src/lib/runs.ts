import { apiFetch } from "./api";

// --- Types ---

export type RunStatus = "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "CANCELLED";

export interface StageResult {
  stageId: string;
  stageName: string;
  command: string;
  status: RunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  logs: string[];
}

export interface Run {
  id: string;
  pipelineId: string;
  pipelineName: string;
  branch: string;
  trigger: string;
  status: RunStatus;
  stageResults: StageResult[];
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  triggeredBy: string;
}

// --- Display helpers ---

export const RUN_STATUS_COLORS: Record<RunStatus, string> = {
  QUEUED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  RUNNING: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  PASSED: "bg-green-100/50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  FAILED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  PASSED: "Passed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

// --- API functions ---

export async function triggerPipeline(pipelineId: string): Promise<Run> {
  return apiFetch<Run>(`/api/pipelines/${pipelineId}/trigger`, {
    method: "POST",
  });
}

export async function listRuns(pipelineId?: string): Promise<Run[]> {
  const query = pipelineId ? `?pipelineId=${pipelineId}` : "";
  return apiFetch<Run[]>(`/api/runs${query}`);
}

export async function getRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}`);
}

export async function cancelRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/api/runs/${id}/cancel`, {
    method: "POST",
  });
}
