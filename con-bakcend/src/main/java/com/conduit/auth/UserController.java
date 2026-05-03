package com.conduit.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * User management endpoints.
 * - /api/users/me — current user profile + change password
 * - /api/users — admin-only: list, create, update role, delete
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * GET /api/users/me — current user profile.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return authService.findById(userId)
                .map(user -> ResponseEntity.ok(new UserDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/users/me/password — change own password.
     */
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "currentPassword and newPassword are required"));
        }

        try {
            authService.changePassword(userId, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/users — list all users (admin/manager only).
     */
    @GetMapping
    public ResponseEntity<?> listUsers(Authentication auth) {
        if (!hasRole(auth, "ADMIN", "MANAGER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        List<User> users = authService.listUsers();
        List<UserDTO> dtoList = users.stream()
                .map(UserDTO::new)
                .toList();

        return ResponseEntity.ok(dtoList);
    }

    /**
     * POST /api/users — create a new user (admin only).
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body, Authentication auth) {
        if (!hasRole(auth, "ADMIN")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can create users"));
        }

        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");
        String roleStr = body.get("role");

        if (username == null || password == null || roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username, password, and role are required"));
        }

        try {
            Role role = Role.valueOf(roleStr.toUpperCase());
            User created = authService.createUser(username, email != null ? email : "", password, role);
            return ResponseEntity.ok(new UserDTO(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/users/{id}/role — update user role (admin only).
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        if (!hasRole(auth, "ADMIN")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can change roles"));
        }

        String roleStr = body.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "role is required"));
        }

        try {
            Role role = Role.valueOf(roleStr.toUpperCase());
            User updated = authService.updateUserRole(id, role);
            return ResponseEntity.ok(new UserDTO(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/users/{id} — delete user (admin only).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, Authentication auth) {
        if (!hasRole(auth, "ADMIN")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can delete users"));
        }

        String requestingUserId = (String) auth.getPrincipal();
        try {
            authService.deleteUser(id, requestingUserId);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (AuthService.AuthException e) {
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
