import { API_ENCRYPTION_ENABLED } from "@/common/constants/app-constants";
import { encryptPayload, decryptPayload } from "./encryption";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Fetch wrapper for backend API calls.
 * - Auto-sets Content-Type and Authorization header
 * - Handles token refresh on 401
 * - Transparently encrypts bodies and decrypts responses if enabled
 * - Throws with error message from backend
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Pre-process body for encryption
  const outBody = body
    ? (API_ENCRYPTION_ENABLED ? JSON.stringify({ data: encryptPayload(body) }) : JSON.stringify(body))
    : undefined;

  let response: Response;
  try {
    response = await fetch(`${path}`, {
      ...rest,
      headers,
      body: outBody,
      credentials: "include",
    });
  } catch {
    clearAccessToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Backend not connected");
  }

  // Handle 401 — try refresh
  if (response.status === 401 && !path.includes("/auth/")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      
      const retryResponse = await fetch(`${path}`, {
        ...rest,
        headers,
        body: outBody,
        credentials: "include",
      });

      if (!retryResponse.ok) {
        let errorObj = await retryResponse.json().catch(() => ({}));
        if (API_ENCRYPTION_ENABLED && errorObj.data && typeof errorObj.data === "string") {
          try { errorObj = decryptPayload(errorObj.data); } catch {}
        }
        throw new Error(errorObj.error || `Request failed: ${retryResponse.status}`);
      }
      
      let retryResult = await retryResponse.json();
      if (API_ENCRYPTION_ENABLED && retryResult.data && typeof retryResult.data === "string") {
        try { retryResult = decryptPayload(retryResult.data); } catch {}
      }
      return retryResult;
    }

    clearAccessToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  if (!response.ok) {
    let errorObj = await response.json().catch(() => ({}));
    if (API_ENCRYPTION_ENABLED && errorObj.data && typeof errorObj.data === "string") {
      try { errorObj = decryptPayload(errorObj.data); } catch {}
    }
    throw new Error(errorObj.error || `Request failed: ${response.status}`);
  }

  let result = await response.json();
  if (API_ENCRYPTION_ENABLED && result.data && typeof result.data === "string") {
    try {
      result = decryptPayload(result.data);
    } catch(e) {
      console.error("Failed to decrypt frontend payload.", e);
    }
  }
  return result;
}

// --- Token storage (in memory + sessionStorage for tab persistence) ---

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("conduit_access_token", token);
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = sessionStorage.getItem("conduit_access_token");
  }
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("conduit_access_token");
  }
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return false;

    // Refresh token result doesn't follow strict data wrapper since it sets a cookie usually
    // but the payload might be wrapped.
    let data = await response.json();
    if (API_ENCRYPTION_ENABLED && data.data && typeof data.data === "string") {
      try { data = decryptPayload(data.data); } catch {}
    }
    
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}
