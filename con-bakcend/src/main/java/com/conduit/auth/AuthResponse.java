package com.conduit.auth;

import java.util.Map;

/**
 * Login/refresh response DTO.
 */
public class AuthResponse {

    private String accessToken;
    private long expiresIn;
    private Map<String, Object> user;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, long expiresIn, Map<String, Object> user) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public Map<String, Object> getUser() { return user; }
    public void setUser(Map<String, Object> user) { this.user = user; }

    /** Build a sanitized user map (no password hash, no internal fields). */
    public static Map<String, Object> sanitizeUser(User u) {
        return Map.of(
            "id", u.getId(),
            "username", u.getUsername(),
            "email", u.getEmail() != null ? u.getEmail() : "",
            "role", u.getRole().name()
        );
    }
}
