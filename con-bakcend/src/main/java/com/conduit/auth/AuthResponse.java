package com.conduit.auth;

import java.util.Map;

/**
 * Login/refresh response DTO.
 */
public class AuthResponse {

    private String accessToken;
    private long expiresIn;
    private UserDTO user;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, long expiresIn, UserDTO user) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }
}
