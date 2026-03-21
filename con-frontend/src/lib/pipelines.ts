import { apiFetch } from "./api";

// --- Types ---

export interface BuildStep {
  id?: string;
  name: string;
  command: string;
  order?: number;
}

export interface Stage {
  id?: string;
  name: string;
  type: "BUILD" | "TEST" | "DEPLOY" | "CUSTOM";
  command: string;
  dependsOn?: string[];
  position?: { x: number; y: number };
  order?: number;
}

export type DefinitionType = "CONDUIT_FILE" | "SCRIPT" | "FREESTYLE";

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  branch: string;
  definitionType: DefinitionType;
  conduitFilePath: string;
  script: string;
  buildSteps: BuildStep[];
  stages: Stage[];
  trigger: "MANUAL" | "WEBHOOK" | "CRON";
  cronExpression?: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
  credentialIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePipelineRequest {
  name: string;
  description?: string;
  repoUrl?: string;
  branch?: string;
  definitionType: DefinitionType;
  conduitFilePath?: string;
  script?: string;
  buildSteps?: BuildStep[];
  stages?: Stage[];
  trigger?: "MANUAL" | "WEBHOOK" | "CRON";
  cronExpression?: string;
  credentialIds?: string[];
}

export interface UpdatePipelineRequest extends Partial<CreatePipelineRequest> {
  status?: "ACTIVE" | "PAUSED" | "DRAFT";
}

// --- Display helpers ---

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100/50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  PAUSED: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
};

export const TRIGGER_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  WEBHOOK: "Webhook",
  CRON: "Cron",
};

export const DEFINITION_LABELS: Record<DefinitionType, string> = {
  CONDUIT_FILE: "ConduitFile",
  SCRIPT: "Script",
  FREESTYLE: "Freestyle",
};

export const DEFINITION_COLORS: Record<DefinitionType, string> = {
  CONDUIT_FILE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  SCRIPT: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  FREESTYLE: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
};

export const STAGE_TYPES = ["BUILD", "TEST", "DEPLOY", "CUSTOM"] as const;

// --- API functions ---

export async function listPipelines(): Promise<Pipeline[]> {
  return apiFetch<Pipeline[]>("/api/pipelines");
}

export async function getPipeline(id: string): Promise<Pipeline> {
  return apiFetch<Pipeline>(`/api/pipelines/${id}`);
}

export async function createPipeline(data: CreatePipelineRequest): Promise<Pipeline> {
  return apiFetch<Pipeline>("/api/pipelines", {
    method: "POST",
    body: data,
  });
}

export async function updatePipeline(id: string, data: UpdatePipelineRequest): Promise<Pipeline> {
  return apiFetch<Pipeline>(`/api/pipelines/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deletePipeline(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/pipelines/${id}`, {
    method: "DELETE",
  });
}
