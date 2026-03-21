package com.conduit.credential;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Credential management endpoints.
 */
@RestController
@RequestMapping("/api/credentials")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    /**
     * GET /api/credentials — list all credentials (sanitized).
     */
    @GetMapping
    public ResponseEntity<?> list() {
        List<Map<String, Object>> credentials = credentialService.listSanitized();
        return ResponseEntity.ok(credentials);
    }

    /**
     * POST /api/credentials — create a credential (admin/manager only).
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Credential body, Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins and managers can create credentials"));
        }

        String userId = (String) auth.getPrincipal();
        try {
            Map<String, Object> created = credentialService.create(body, userId);
            return ResponseEntity.ok(created);
        } catch (CredentialService.CredentialException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/credentials/{id} — update a credential (admin/manager only).
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Credential body, Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins and managers can update credentials"));
        }

        try {
            Map<String, Object> updated = credentialService.update(id, body);
            return ResponseEntity.ok(updated);
        } catch (CredentialService.CredentialException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/credentials/{id} — delete a credential (admin/manager only).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins and managers can delete credentials"));
        }

        try {
            credentialService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Credential deleted"));
        } catch (CredentialService.CredentialException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Helpers ---

    private boolean hasRole(Authentication auth, String... roles) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> {
                    for (String role : roles) {
                        if (a.getAuthority().equals("ROLE_" + role)) return true;
                    }
                    return false;
                });
    }
}
