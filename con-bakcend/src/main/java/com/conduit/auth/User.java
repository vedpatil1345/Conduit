package com.conduit.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;
import java.util.*;

/**
 * User model stored in {@code users.json.enc}.
 */
public class User {

    private String id;
    private String username;
    private String email;
    @JsonIgnore
    private String passwordHash;

    private Role role;

    @JsonIgnore
    private List<String> apiTokens = new ArrayList<>();

    @JsonIgnore
    /** Revoked refresh token JTIs — checked during refresh. */
    private Set<String> revokedRefreshTokens = new HashSet<>();

    /** Number of consecutive failed login attempts. */
    private int failedAttempts;

    @JsonIgnore
    /** Account locked until this instant (null = not locked). */
    private Instant lockedUntil;

    private Instant createdAt;
    private Instant updatedAt;

    public User() {
    }

    public User(String username, String email, String passwordHash, Role role) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public List<String> getApiTokens() { return apiTokens; }
    public void setApiTokens(List<String> apiTokens) { this.apiTokens = apiTokens; }

    public Set<String> getRevokedRefreshTokens() { return revokedRefreshTokens; }
    public void setRevokedRefreshTokens(Set<String> revokedRefreshTokens) { this.revokedRefreshTokens = revokedRefreshTokens; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }

    public Instant getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Instant lockedUntil) { this.lockedUntil = lockedUntil; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    /** Check if the account is currently locked. */
    @JsonIgnore
    public boolean isLocked() {
        return lockedUntil != null && Instant.now().isBefore(lockedUntil);
    }
}
