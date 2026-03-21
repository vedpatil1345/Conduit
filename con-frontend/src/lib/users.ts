import { apiFetch } from "./api";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "DEVELOPER" | "VIEWER" | "SERVICE_ACCOUNT";
}

export const ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "VIEWER", "SERVICE_ACCOUNT"] as const;

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Full access — manage users, pipelines, settings",
  MANAGER: "Manage pipelines and view team members",
  DEVELOPER: "Create and run pipelines",
  VIEWER: "View-only access to dashboards and runs",
  SERVICE_ACCOUNT: "Automated access for CI/CD integrations",
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  DEVELOPER: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  VIEWER: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  SERVICE_ACCOUNT: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

/** Get current user profile */
export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me");
}

/** Change own password */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch("/api/users/me/password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}

/** List all users (admin/manager only) */
export async function listUsers(): Promise<UserProfile[]> {
  return apiFetch<UserProfile[]>("/api/users");
}

/** Create a new user (admin only) */
export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role: string;
}): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users", {
    method: "POST",
    body: data,
  });
}

/** Update user role (admin only) */
export async function updateUserRole(userId: string, role: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/api/users/${userId}/role`, {
    method: "PUT",
    body: { role },
  });
}

/** Delete a user (admin only) */
export async function deleteUser(userId: string): Promise<void> {
  await apiFetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
}
