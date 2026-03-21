package com.conduit.credential;

import com.conduit.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Credential CRUD with sanitization.
 */
@Service
public class CredentialService {

    private static final Logger log = LoggerFactory.getLogger(CredentialService.class);
    private static final String CREDENTIALS_PATH = "credentials";
    private static final String MASKED = "••••••••";

    private final StorageService storageService;

    public CredentialService(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * List all credentials (sanitized — no secrets).
     */
    public List<Map<String, Object>> listSanitized() {
        List<Credential> credentials = storageService.readList(CREDENTIALS_PATH, Credential.class);
        return credentials.stream().map(this::sanitize).toList();
    }

    /**
     * Find a credential by ID (raw — for internal pipeline execution).
     */
    public Optional<Credential> findById(String id) {
        return storageService.readList(CREDENTIALS_PATH, Credential.class).stream()
                .filter(c -> c.getId().equals(id))
                .findFirst();
    }

    /**
     * Create a new credential.
     */
    public Map<String, Object> create(Credential input, String createdBy) {
        List<Credential> credentials = new ArrayList<>(storageService.readList(CREDENTIALS_PATH, Credential.class));

        if (input.getName() == null || input.getName().isBlank()) {
            throw new CredentialException("Credential name is required");
        }

        if (input.getType() == null) {
            throw new CredentialException("Credential type is required");
        }

        // Check duplicate name
        boolean exists = credentials.stream().anyMatch(c -> c.getName().equalsIgnoreCase(input.getName()));
        if (exists) {
            throw new CredentialException("Credential '" + input.getName() + "' already exists");
        }

        Credential credential = new Credential(input.getName(), input.getDescription(), input.getType(), createdBy);

        // Copy type-specific fields
        switch (input.getType()) {
            case USERNAME_PASSWORD -> {
                credential.setUsername(input.getUsername());
                credential.setPassword(input.getPassword());
            }
            case SECRET_TEXT -> credential.setSecretText(input.getSecretText());
            case SSH_KEY -> {
                credential.setSshKey(input.getSshKey());
                credential.setSshPassphrase(input.getSshPassphrase());
            }
            case TOKEN -> credential.setToken(input.getToken());
        }

        credentials.add(credential);
        storageService.write(CREDENTIALS_PATH, credentials);

        log.info("Created credential '{}' (id: {}, type: {})", credential.getName(), credential.getId(), credential.getType());
        return sanitize(credential);
    }

    /**
     * Update a credential.
     */
    public Map<String, Object> update(String id, Credential input) {
        List<Credential> credentials = new ArrayList<>(storageService.readList(CREDENTIALS_PATH, Credential.class));

        Credential credential = credentials.stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new CredentialException("Credential not found"));

        if (input.getName() != null && !input.getName().isBlank()) {
            // Check name conflict
            if (!input.getName().equalsIgnoreCase(credential.getName())) {
                boolean conflict = credentials.stream()
                        .filter(c -> !c.getId().equals(id))
                        .anyMatch(c -> c.getName().equalsIgnoreCase(input.getName()));
                if (conflict) {
                    throw new CredentialException("Credential '" + input.getName() + "' already exists");
                }
            }
            credential.setName(input.getName());
        }

        if (input.getDescription() != null) credential.setDescription(input.getDescription());

        // Update secret fields (only if provided — not masked placeholder)
        if (input.getUsername() != null) credential.setUsername(input.getUsername());
        if (input.getPassword() != null && !input.getPassword().equals(MASKED)) credential.setPassword(input.getPassword());
        if (input.getSecretText() != null && !input.getSecretText().equals(MASKED)) credential.setSecretText(input.getSecretText());
        if (input.getSshKey() != null && !input.getSshKey().equals(MASKED)) credential.setSshKey(input.getSshKey());
        if (input.getSshPassphrase() != null && !input.getSshPassphrase().equals(MASKED)) credential.setSshPassphrase(input.getSshPassphrase());
        if (input.getToken() != null && !input.getToken().equals(MASKED)) credential.setToken(input.getToken());

        credential.setUpdatedAt(Instant.now());
        storageService.write(CREDENTIALS_PATH, credentials);

        log.info("Updated credential '{}' (id: {})", credential.getName(), id);
        return sanitize(credential);
    }

    /**
     * Delete a credential.
     */
    public void delete(String id) {
        List<Credential> credentials = new ArrayList<>(storageService.readList(CREDENTIALS_PATH, Credential.class));
        boolean removed = credentials.removeIf(c -> c.getId().equals(id));
        if (!removed) {
            throw new CredentialException("Credential not found");
        }

        storageService.write(CREDENTIALS_PATH, credentials);
        log.info("Deleted credential (id: {})", id);
    }

    /**
     * Build a sanitized map — secrets replaced with mask.
     */
    private Map<String, Object> sanitize(Credential c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("name", c.getName());
        map.put("description", c.getDescription() != null ? c.getDescription() : "");
        map.put("type", c.getType().name());
        map.put("createdBy", c.getCreatedBy());
        map.put("createdAt", c.getCreatedAt());
        map.put("updatedAt", c.getUpdatedAt());

        // Include non-secret fields, mask secrets
        switch (c.getType()) {
            case USERNAME_PASSWORD -> {
                map.put("username", c.getUsername() != null ? c.getUsername() : "");
                map.put("password", c.getPassword() != null ? MASKED : "");
            }
            case SECRET_TEXT -> map.put("secretText", c.getSecretText() != null ? MASKED : "");
            case SSH_KEY -> {
                map.put("sshKey", c.getSshKey() != null ? MASKED : "");
                map.put("sshPassphrase", c.getSshPassphrase() != null ? MASKED : "");
            }
            case TOKEN -> map.put("token", c.getToken() != null ? MASKED : "");
        }

        return map;
    }

    // --- Exception ---

    public static class CredentialException extends RuntimeException {
        public CredentialException(String message) {
            super(message);
        }
    }
}
