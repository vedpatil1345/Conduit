package com.conduit.run;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Run endpoints — trigger, list, detail, cancel.
 */
@RestController
@RequestMapping("/api")
public class RunController {

    private final RunService runService;

    public RunController(RunService runService) {
        this.runService = runService;
    }

    /**
     * POST /api/pipelines/{pipelineId}/trigger — trigger a new run.
     */
    @PostMapping("/pipelines/{pipelineId}/trigger")
    public ResponseEntity<?> trigger(@PathVariable String pipelineId, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            Run run = runService.trigger(pipelineId, userId);
            return ResponseEntity.ok(run);
        } catch (RunService.RunException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/runs — list runs, optionally filtered by pipelineId.
     */
    @GetMapping("/runs")
    public ResponseEntity<?> list(@RequestParam(required = false) String pipelineId) {
        List<Run> runs = runService.list(pipelineId);
        return ResponseEntity.ok(runs);
    }

    /**
     * GET /api/runs/{id} — get run detail.
     */
    @GetMapping("/runs/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return runService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/runs/{id}/cancel — cancel a run.
     */
    @PostMapping("/runs/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String id) {
        try {
            Run run = runService.cancel(id);
            return ResponseEntity.ok(run);
        } catch (RunService.RunException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
