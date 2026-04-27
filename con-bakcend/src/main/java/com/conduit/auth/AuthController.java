package com.conduit.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

/**
 * Authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "conduit_refresh_token";

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    /**
     * POST /api/auth/login
     * Authenticate with username + password. Returns access token in body, refresh
     * token in HttpOnly cookie.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        try {
            AuthService.AuthResult result = authService.login(request);

            // Set refresh token as HttpOnly cookie
            setRefreshCookie(response, result.getRefreshToken(), result.isRememberMe());

            AuthResponse body = new AuthResponse(
                    result.getAccessToken(),
                    jwtService.getAccessTokenExpiresIn(),
                    AuthResponse.sanitizeUser(result.getUser()));

            return ResponseEntity.ok(body);
        } catch (AuthService.AuthException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/refresh
     * Issue a new access token using the refresh token from HttpOnly cookie.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshCookie(request);
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("error", "No refresh token"));
        }

        try {
            AuthService.AuthResult result = authService.refresh(refreshToken);

            AuthResponse body = new AuthResponse(
                    result.getAccessToken(),
                    jwtService.getAccessTokenExpiresIn(),
                    AuthResponse.sanitizeUser(result.getUser()));

            return ResponseEntity.ok(body);
        } catch (AuthService.AuthException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/logout
     * Revoke the refresh token and clear the cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshCookie(request);
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        // Clear the cookie
        clearRefreshCookie(response);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // --- Cookie helpers ---

    private void setRefreshCookie(HttpServletResponse response, String token, boolean rememberMe) {
        Duration maxAge = jwtService.getRefreshTokenDuration(rememberMe);

        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // TODO: set to false in dev
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) maxAge.toSeconds());
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // TODO: set to false in dev
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null)
            return null;

        for (Cookie cookie : cookies) {
            if (REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
