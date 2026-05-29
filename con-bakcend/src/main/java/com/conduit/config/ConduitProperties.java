package com.conduit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed config binding for all {@code conduit.*} properties in application.yml.
 */
@ConfigurationProperties(prefix = "conduit")
public class ConduitProperties {

    /** Runtime mode: "local" (JSON file storage) or "server" (Postgres + Redis). */
    private String mode = "local";

    /** Root data directory. Defaults to ~/.conduit */
    private String dataDir = System.getProperty("user.home") + "/.conduit";

    /** Port the server listens on. */
    private int port = 8080;

    /**
     * AES-256 secret key (base64-encoded).
     * Generated at first startup / setup wizard, stored in conduit.yml.
     * Null until setup completes or conduit.yml is loaded.
     */
    private String secretKey;

    /** List of allowed CORS origins. Defaults to http://localhost:3000 in dev. */
    private java.util.List<String> allowedOrigins = java.util.Collections.singletonList("http://localhost:3000");

    // --- Getters & Setters ---

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getDataDir() {
        return dataDir;
    }

    public void setDataDir(String dataDir) {
        this.dataDir = dataDir;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    /** RS256 private key (base64-encoded PKCS8) for signing JWTs. */
    private String jwtPrivateKey;

    /** RS256 public key (base64-encoded X509) for verifying JWTs. */
    private String jwtPublicKey;

    public String getJwtPrivateKey() { return jwtPrivateKey; }
    public void setJwtPrivateKey(String jwtPrivateKey) { this.jwtPrivateKey = jwtPrivateKey; }

    public String getJwtPublicKey() { return jwtPublicKey; }
    public void setJwtPublicKey(String jwtPublicKey) { this.jwtPublicKey = jwtPublicKey; }

    public java.util.List<String> getAllowedOrigins() { return allowedOrigins; }
    public void setAllowedOrigins(java.util.List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }

    public boolean isLocalMode() {
        return "local".equalsIgnoreCase(mode);
    }

    public boolean isServerMode() {
        return "server".equalsIgnoreCase(mode);
    }
}
