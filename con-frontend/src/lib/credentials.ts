import { apiFetch } from "./api";

// --- Types ---

export type CredentialType = "USERNAME_PASSWORD" | "SECRET_TEXT" | "SSH_KEY" | "TOKEN";

export interface CredentialSummary {
  id: string;
  name: string;
  description: string;
  type: CredentialType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Type-specific (masked)
  username?: string;
  password?: string;
  secretText?: string;
  sshKey?: string;
  sshPassphrase?: string;
  token?: string;
}

export interface CreateCredentialRequest {
  name: string;
  description?: string;
  type: CredentialType;
  username?: string;
  password?: string;
  secretText?: string;
  sshKey?: string;
  sshPassphrase?: string;
  token?: string;
}

// --- Display helpers ---

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  USERNAME_PASSWORD: "Username & Password",
  SECRET_TEXT: "Secret Text",
  SSH_KEY: "SSH Key",
  TOKEN: "Token",
};

export const CREDENTIAL_TYPE_COLORS: Record<CredentialType, string> = {
  USERNAME_PASSWORD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  SECRET_TEXT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  SSH_KEY: "bg-green-100/50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  TOKEN: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

// --- API functions ---

export async function listCredentials(): Promise<CredentialSummary[]> {
  return apiFetch<CredentialSummary[]>("/api/credentials");
}

export async function createCredential(data: CreateCredentialRequest): Promise<CredentialSummary> {
  return apiFetch<CredentialSummary>("/api/credentials", {
    method: "POST",
    body: data,
  });
}

export async function updateCredential(id: string, data: Partial<CreateCredentialRequest>): Promise<CredentialSummary> {
  return apiFetch<CredentialSummary>(`/api/credentials/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteCredential(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/credentials/${id}`, {
    method: "DELETE",
  });
}
