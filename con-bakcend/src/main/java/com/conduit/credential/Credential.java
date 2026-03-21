package com.conduit.credential;

import java.time.Instant;
import java.util.UUID;

/**
 * Credential model stored in {@code credentials.json.enc}.
 * <p>
 * Sensitive fields (password, secretText, sshKey, token) are stored
 * in the encrypted JSON file. They are masked in API responses.
 */
public class Credential {

    private String id;
    private String name;
    private String description;
    private CredentialType type;

    // --- Type-specific fields ---

    /** For USERNAME_PASSWORD */
    private String username;
    private String password;

    /** For SECRET_TEXT */
    private String secretText;

    /** For SSH_KEY */
    private String sshKey;
    private String sshPassphrase;

    /** For TOKEN */
    private String token;

    // --- Audit ---
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    public Credential() {
    }

    public Credential(String name, String description, CredentialType type, String createdBy) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.description = description;
        this.type = type;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public CredentialType getType() { return type; }
    public void setType(CredentialType type) { this.type = type; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSecretText() { return secretText; }
    public void setSecretText(String secretText) { this.secretText = secretText; }

    public String getSshKey() { return sshKey; }
    public void setSshKey(String sshKey) { this.sshKey = sshKey; }

    public String getSshPassphrase() { return sshPassphrase; }
    public void setSshPassphrase(String sshPassphrase) { this.sshPassphrase = sshPassphrase; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
