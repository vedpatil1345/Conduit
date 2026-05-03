package com.conduit.pipeline;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Pipeline CRUD endpoints.
 */
@RestController
@RequestMapping("/api/pipelines")
public class PipelineController {

    private final PipelineService pipelineService;

    public PipelineController(PipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    /**
     * GET /api/pipelines — list all pipelines.
     */
    @GetMapping
    public ResponseEntity<?> list() {
        List<Pipeline> pipelines = pipelineService.list();
        return ResponseEntity.ok(pipelines);
    }

    /**
     * GET /api/pipelines/{id} — get pipeline by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return pipelineService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/pipelines — create a new pipeline (admin/manager only).
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Pipeline body, Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins and managers can create pipelines"));
        }

        String userId = (String) auth.getPrincipal();

        try {
            Pipeline created = pipelineService.create(body, userId);
            return ResponseEntity.ok(created);
        } catch (PipelineService.PipelineException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/pipelines/{id} — update a pipeline (admin/manager only).
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Pipeline body, Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins and managers can update pipelines"));
        }

        try {
            Pipeline updated = pipelineService.update(id, body);
            return ResponseEntity.ok(updated);
        } catch (PipelineService.PipelineException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/pipelines/{id} — delete a pipeline.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins and managers can delete pipelines"));
        }

        try {
            pipelineService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Pipeline deleted"));
        } catch (PipelineService.PipelineException e) {
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
