package com.conduit.config;

import com.conduit.auth.AuthService;
import com.conduit.auth.JwtService;
import com.conduit.common.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Map;

/**
 * Creates the {@code ~/.conduit/} data directory structure on startup
 * and generates {@code conduit.yml} with secret key + JWT keys if it doesn't exist.
 * Also ensures a default admin user exists.
 */
@Component
public class DataDirectoryInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataDirectoryInitializer.class);

    private final ConduitProperties properties;
    private final AuthService authService;

    public DataDirectoryInitializer(ConduitProperties properties, AuthService authService) {
        this.properties = properties;
        this.authService = authService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Path root = Paths.get(properties.getDataDir());

        // Create directory structure
        createDirectory(root);
        createDirectory(root.resolve("data"));
        createDirectory(root.resolve("data/pipelines"));
        createDirectory(root.resolve("data/runs"));
        createDirectory(root.resolve("logs"));
        createDirectory(root.resolve("extensions"));

        // Generate conduit.yml if missing
        Path configFile = root.resolve("conduit.yml");
        if (!Files.exists(configFile)) {
            generateDefaultConfig(configFile);
        } else {
            log.info("Config file already exists: {}", configFile);
            loadKeysFromConfig(configFile);
        }

        // Ensure default admin user exists
        authService.ensureDefaultAdmin();

        log.info("Conduit data directory ready: {}", root);
        log.info("Running in {} mode", properties.getMode());
    }

    private void createDirectory(Path path) throws IOException {
        if (!Files.exists(path)) {
            Files.createDirectories(path);
            log.info("Created directory: {}", path);
        }
    }

    private void generateDefaultConfig(Path configFile) throws IOException {
        String secretKey = EncryptionService.generateSecretKey();
        Map<String, String> jwtKeys = JwtService.generateKeyPair();

        String yaml = """
                # Conduit Configuration
                # Generated automatically on first startup.
                # Do NOT share this file — it contains your encryption secret key and JWT keys.
                
                conduit:
                  secret-key: %s
                  jwt-private-key: %s
                  jwt-public-key: %s
                  mode: %s
                  port: %d
                """.formatted(
                secretKey,
                jwtKeys.get("privateKey"),
                jwtKeys.get("publicKey"),
                properties.getMode(),
                properties.getPort()
        );

        Files.writeString(configFile, yaml, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE_NEW);

        // Set on properties so they're available immediately
        properties.setSecretKey(secretKey);
        properties.setJwtPrivateKey(jwtKeys.get("privateKey"));
        properties.setJwtPublicKey(jwtKeys.get("publicKey"));

        log.info("Generated config file with new secret key and JWT keys: {}", configFile);
    }

    private void loadKeysFromConfig(Path configFile) {
        try {
            String content = Files.readString(configFile, StandardCharsets.UTF_8);
            for (String line : content.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.startsWith("secret-key:") && isBlank(properties.getSecretKey())) {
                    properties.setSecretKey(extractValue(trimmed, "secret-key:"));
                } else if (trimmed.startsWith("jwt-private-key:") && isBlank(properties.getJwtPrivateKey())) {
                    properties.setJwtPrivateKey(extractValue(trimmed, "jwt-private-key:"));
                } else if (trimmed.startsWith("jwt-public-key:") && isBlank(properties.getJwtPublicKey())) {
                    properties.setJwtPublicKey(extractValue(trimmed, "jwt-public-key:"));
                }
            }
            log.info("Loaded keys from {}", configFile);
        } catch (IOException e) {
            log.warn("Failed to read config file: {}", e.getMessage());
        }
    }

    private static String extractValue(String line, String prefix) {
        return line.substring(prefix.length()).trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
