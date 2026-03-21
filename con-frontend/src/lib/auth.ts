import { apiFetch, setAccessToken, clearAccessToken } from "./api";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "DEVELOPER" | "VIEWER" | "SERVICE_ACCOUNT";
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Login with username + password.
 * Sets the access token and returns the user.
 */
export async function login(request: LoginRequest): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: request,
  });

  setAccessToken(data.accessToken);
  return data;
}

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 */
export async function refreshToken(): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/refresh", {
    method: "POST",
  });

  setAccessToken(data.accessToken);
  return data;
}

/**
 * Logout — revokes refresh token on backend, clears local state.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore — we clear local state regardless
  }
  clearAccessToken();
}
