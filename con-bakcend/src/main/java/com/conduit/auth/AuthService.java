package com.conduit.auth;

import com.conduit.storage.StorageService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Authentication business logic: login, refresh, logout, brute-force lockout.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);
    private static final String USERS_PATH = "users";

    private final StorageService storageService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(StorageService storageService, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.storageService = storageService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Authenticate a user and return tokens.
     *
     * @throws AuthException on invalid credentials or locked account
     */
    public AuthResult login(AuthRequest request) {
        List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));
        User user = users.stream()
                .filter(u -> u.getUsername().equals(request.getUsername()))
                .findFirst()
                .orElseThrow(() -> new AuthException("Invalid username or password"));

        // Check lockout
        if (user.isLocked()) {
            long remainingSeconds = Duration.between(Instant.now(), user.getLockedUntil()).toSeconds();
            throw new AuthException("Account locked. Try again in " + remainingSeconds + " seconds");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedAttempt(user, users);
            throw new AuthException("Invalid username or password");
        }

        // Success — reset failed attempts
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setUpdatedAt(Instant.now());
        storageService.write(USERS_PATH, users);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user, request.isRememberMe());

        log.info("User '{}' logged in successfully", user.getUsername());

        return new AuthResult(accessToken, refreshToken, user, request.isRememberMe());
    }

    /**
     * Refresh access token using a valid refresh token.
     */
    public AuthResult refresh(String refreshToken) {
        Claims claims;
        try {
            claims = jwtService.validateToken(refreshToken);
        } catch (JwtException e) {
            throw new AuthException("Invalid or expired refresh token");
        }

        // Check token type
        String type = claims.get("type", String.class);
        if (!"refresh".equals(type)) {
            throw new AuthException("Not a refresh token");
        }

        // Check revocation
        String jti = jwtService.extractJti(claims);
        String userId = jwtService.extractUserId(claims);

        List<User> users = storageService.readList(USERS_PATH, User.class);
        User user = users.stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AuthException("User not found"));

        if (user.getRevokedRefreshTokens().contains(jti)) {
            throw new AuthException("Refresh token has been revoked");
        }

        // Issue new access token
        String newAccessToken = jwtService.generateAccessToken(user);

        log.info("Token refreshed for user '{}'", user.getUsername());

        return new AuthResult(newAccessToken, refreshToken, user, false);
    }

    /**
     * Logout — revoke the refresh token.
     */
    public void logout(String refreshToken) {
        try {
            Claims claims = jwtService.validateToken(refreshToken);
            String jti = jwtService.extractJti(claims);
            String userId = jwtService.extractUserId(claims);

            List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));
            users.stream()
                    .filter(u -> u.getId().equals(userId))
                    .findFirst()
                    .ifPresent(user -> {
                        user.getRevokedRefreshTokens().add(jti);
                        user.setUpdatedAt(Instant.now());
                        storageService.write(USERS_PATH, users);
                        log.info("User '{}' logged out, refresh token revoked", user.getUsername());
                    });
        } catch (JwtException e) {
            // Token already invalid — logout is still successful
            log.debug("Logout with invalid token — ignoring");
        }
    }

    /**
     * Find a user by ID (for the auth filter).
     */
    public Optional<User> findById(String userId) {
        List<User> users = storageService.readList(USERS_PATH, User.class);
        return users.stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst();
    }

    /**
     * Create the default admin user if no users exist.
     */
    public void ensureDefaultAdmin() {
        List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));
        if (users.isEmpty()) {
            String hashedPassword = passwordEncoder.encode("admin");
            User admin = new User("admin", "admin@localhost", hashedPassword, Role.ADMIN);
            users.add(admin);
            storageService.write(USERS_PATH, users);
            log.info("Created default admin user");
        }
    }

    /**
     * Change password for a user.
     */
    public void changePassword(String userId, String currentPassword, String newPassword) {
        List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));
        User user = users.stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AuthException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new AuthException("Current password is incorrect");
        }

        if (newPassword.length() < 4) {
            throw new AuthException("New password must be at least 4 characters");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        storageService.write(USERS_PATH, users);
        log.info("Password changed for user '{}'", user.getUsername());
    }

    /**
     * Create a new user (admin only).
     */
    public User createUser(String username, String email, String password, Role role) {
        List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));

        // Check for duplicate username
        boolean exists = users.stream().anyMatch(u -> u.getUsername().equalsIgnoreCase(username));
        if (exists) {
            throw new AuthException("Username '" + username + "' already exists");
        }

        String hashedPassword = passwordEncoder.encode(password);
        User newUser = new User(username, email, hashedPassword, role);
        users.add(newUser);
        storageService.write(USERS_PATH, users);

        log.info("Created new user '{}' with role {}", username, role);
        return newUser;
    }

    /**
     * List all users (sanitized — no password hashes returned).
     */
    public List<User> listUsers() {
        return storageService.readList(USERS_PATH, User.class);
    }

    /**
     * Update a user's role (admin only).
     */
    public User updateUserRole(String userId, Role newRole) {
        List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));
        User user = users.stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AuthException("User not found"));

        user.setRole(newRole);
        user.setUpdatedAt(Instant.now());
        storageService.write(USERS_PATH, users);
        log.info("Updated role for user '{}' to {}", user.getUsername(), newRole);
        return user;
    }

    /**
     * Delete a user (admin only). Cannot delete yourself.
     */
    public void deleteUser(String userId, String requestingUserId) {
        if (userId.equals(requestingUserId)) {
            throw new AuthException("Cannot delete your own account");
        }

        List<User> users = new ArrayList<>(storageService.readList(USERS_PATH, User.class));
        boolean removed = users.removeIf(u -> u.getId().equals(userId));
        if (!removed) {
            throw new AuthException("User not found");
        }

        storageService.write(USERS_PATH, users);
        log.info("Deleted user with ID {}", userId);
    }

    // --- Private ---

    private void handleFailedAttempt(User user, List<User> users) {
        user.setFailedAttempts(user.getFailedAttempts() + 1);

        if (user.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(Instant.now().plus(LOCKOUT_DURATION));
            log.warn("User '{}' locked out after {} failed attempts", user.getUsername(), MAX_FAILED_ATTEMPTS);
        }

        user.setUpdatedAt(Instant.now());
        storageService.write(USERS_PATH, users);
    }

    // --- Inner classes ---

    public static class AuthResult {
        private final String accessToken;
        private final String refreshToken;
        private final User user;
        private final boolean rememberMe;

        public AuthResult(String accessToken, String refreshToken, User user, boolean rememberMe) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.user = user;
            this.rememberMe = rememberMe;
        }

        public String getAccessToken() { return accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public User getUser() { return user; }
        public boolean isRememberMe() { return rememberMe; }
    }

    public static class AuthException extends RuntimeException {
        public AuthException(String message) {
            super(message);
        }
    }
}
