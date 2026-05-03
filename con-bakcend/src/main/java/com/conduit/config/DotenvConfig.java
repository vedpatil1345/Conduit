package com.conduit.config;

import org.springframework.context.annotation.Configuration;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

/**
 * Manually loads .env file from the project root and sets them as system properties.
 * This is necessary because Spring Boot does not load .env files by default.
 */
@Configuration
public class DotenvConfig {

    static {
        loadDotenv();
    }

    private static void loadDotenv() {
        // Try to find .env in the current directory or parent
        File envFile = new File(".env");
        if (!envFile.exists()) {
            // Also check one level up if we're running inside the child folder
            envFile = new File("../.env");
        }

        if (envFile.exists()) {
            System.out.println("[Dotenv] environment loaded");
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;

                    String[] parts = line.split("=", 2);
                    if (parts.length == 2) {
                        String key = parts[0].trim();
                        String value = parts[1].trim();
                        // Only set if not already set by actual environment variables
                        if (System.getenv(key) == null && System.getProperty(key) == null) {
                            System.setProperty(key, value);
                            // Also handle the spring property mapping
                            if (key.equals("CONDUIT_SECRET_KEY")) {
                                System.setProperty("conduit.api.encryption.secret-key", value);
                            }
                        }
                    }
                }
            } catch (IOException e) {
                System.err.println("[Dotenv] Error reading .env file: " + e.getMessage());
            }
        } else {
            System.out.println("[Dotenv] No .env file found. Relying on system environment variables.");
        }
    }
}
