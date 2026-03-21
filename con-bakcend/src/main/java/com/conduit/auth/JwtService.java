package com.conduit.auth;

import com.conduit.config.ConduitProperties;
import io.jsonwebtoken.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.*;
import java.security.spec.*;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * JWT RS256 token service.
 * <p>
 * Access token: 15 minutes.
 * Refresh token: 7 days (30 days with "remember me").
 * <p>
 * Keys are stored base64-encoded in {@code conduit.yml} via {@link ConduitProperties}.
 */
@Service
public class JwtService {
    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private static final Duration ACCESS_TOKEN_DURATION = Duration.ofMinutes(15);
    private static final Duration REFRESH_TOKEN_DURATION = Duration.ofDays(7);
    private static final Duration REFRESH_TOKEN_REMEMBER_ME_DURATION = Duration.ofDays(30);

    private final ConduitProperties properties;
    private KeyPair keyPair;

    public JwtService(ConduitProperties properties) {
        this.properties = properties;
    }

    /**
     * Generate a short-lived access token.
     */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ACCESS_TOKEN_DURATION)))
                .id(UUID.randomUUID().toString())
                .signWith(getPrivateKey(), Jwts.SIG.RS256)
                .compact();
    }

    /**
     * Generate a long-lived refresh token.
     */
    public String generateRefreshToken(User user, boolean rememberMe) {
        Instant now = Instant.now();
        Duration duration = rememberMe ? REFRESH_TOKEN_REMEMBER_ME_DURATION : REFRESH_TOKEN_DURATION;

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(duration)))
                .id(UUID.randomUUID().toString())
                .signWith(getPrivateKey(), Jwts.SIG.RS256)
                .compact();
    }

    /**
     * Validate and parse a token. Returns claims if valid.
     *
     * @throws JwtException if token is invalid or expired
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getPublicKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract user ID from a valid token's claims.
     */
    public String extractUserId(Claims claims) {
        return claims.get("userId", String.class);
    }

    /**
     * Extract the JTI (token ID) from claims for revocation tracking.
     */
    public String extractJti(Claims claims) {
        return claims.getId();
    }

    /**
     * Get the access token duration in seconds (for response).
     */
    public long getAccessTokenExpiresIn() {
        return ACCESS_TOKEN_DURATION.toSeconds();
    }

    /**
     * Get the refresh token duration (for cookie max-age).
     */
    public Duration getRefreshTokenDuration(boolean rememberMe) {
        return rememberMe ? REFRESH_TOKEN_REMEMBER_ME_DURATION : REFRESH_TOKEN_DURATION;
    }

    /**
     * Generate a new RS256 key pair and return as base64-encoded strings.
     */
    public static Map<String, String> generateKeyPair() {
        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(2048);
            KeyPair kp = keyGen.generateKeyPair();

            String privateKey = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
            String publicKey = Base64.getEncoder().encodeToString(kp.getPublic().getEncoded());

            return Map.of("privateKey", privateKey, "publicKey", publicKey);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate RSA key pair", e);
        }
    }

    // --- Internal key management ---

    private PrivateKey getPrivateKey() {
        return getKeyPair().getPrivate();
    }

    private PublicKey getPublicKey() {
        return (java.security.interfaces.RSAPublicKey) getKeyPair().getPublic();
    }

    private synchronized KeyPair getKeyPair() {
        if (keyPair != null) {
            return keyPair;
        }

        String privKeyB64 = properties.getJwtPrivateKey();
        String pubKeyB64 = properties.getJwtPublicKey();

        if (privKeyB64 == null || privKeyB64.isBlank() || pubKeyB64 == null || pubKeyB64.isBlank()) {
            throw new IllegalStateException(
                    "JWT keys not configured. Run setup wizard or check conduit.yml for jwt-private-key / jwt-public-key");
        }

        try {
            byte[] privBytes = Base64.getDecoder().decode(privKeyB64);
            byte[] pubBytes = Base64.getDecoder().decode(pubKeyB64);

            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PrivateKey privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privBytes));
            PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(pubBytes));

            this.keyPair = new KeyPair(publicKey, privateKey);
            log.info("JWT RS256 key pair loaded successfully");
            return keyPair;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load JWT keys from config", e);
        }
    }
}
