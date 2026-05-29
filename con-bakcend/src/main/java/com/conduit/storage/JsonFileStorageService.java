package com.conduit.storage;

import com.conduit.common.EncryptionService;
import com.conduit.config.ConduitProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Local-mode storage backed by AES-256 encrypted JSON files.
 * <p>
 * File naming convention:
 * <ul>
 *   <li>{@code .json.enc} — encrypted JSON (users, integrations, pipelines, runs)</li>
 *   <li>{@code .log} — plain-text log files</li>
 * </ul>
 * <p>
 * All writes are atomic: write to {@code .tmp} first, then {@code Files.move(ATOMIC_MOVE)}.
 */
@Service
public class JsonFileStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(JsonFileStorageService.class);
    private static final String ENC_EXTENSION = ".json.enc";

    private final ConduitProperties properties;
    private final EncryptionService encryptionService;
    private final ObjectMapper objectMapper;

    public JsonFileStorageService(ConduitProperties properties, EncryptionService encryptionService) {
        this.properties = properties;
        this.encryptionService = encryptionService;
        this.objectMapper = new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT)
                .findAndRegisterModules();
    }

    @Override
    public <T> Optional<T> read(String path, Class<T> type) {
        Path filePath = resolveDataPath(path);
        if (!Files.exists(filePath)) {
            return Optional.empty();
        }

        try {
            String content = readFileContent(filePath);
            T result = objectMapper.readValue(content, type);
            return Optional.of(result);
        } catch (Exception e) {
            log.error("Failed to read from {}: {}", filePath, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public <T> List<T> readList(String path, Class<T> type) {
        Path filePath = resolveDataPath(path);
        if (!Files.exists(filePath)) {
            return Collections.emptyList();
        }

        try {
            String content = readFileContent(filePath);
            return objectMapper.readValue(content,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, type));
        } catch (Exception e) {
            log.error("Failed to read list from {}: {}", filePath, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public <T> void write(String path, T data) {
        Path filePath = resolveDataPath(path);
        Path tmpPath = filePath.resolveSibling(filePath.getFileName() + ".tmp");

        try {
            // Ensure parent directories exist
            Files.createDirectories(filePath.getParent());

            String json = objectMapper.writeValueAsString(data);
            String contentToWrite;

            if (isEncryptedPath(filePath)) {
                contentToWrite = encryptionService.encrypt(json);
            } else {
                contentToWrite = json;
            }

            // Atomic write: write to .tmp, then move
            Files.writeString(tmpPath, contentToWrite, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            Files.move(tmpPath, filePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);

            log.debug("Written to {}", filePath);
        } catch (IOException e) {
            // Clean up tmp file on failure
            try {
                Files.deleteIfExists(tmpPath);
            } catch (IOException ignored) {
            }
            throw new RuntimeException("Failed to write to " + filePath, e);
        }
    }

    @Override
    public void delete(String path) {
        Path filePath = resolveDataPath(path);
        try {
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.debug("Deleted {}", filePath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete " + filePath, e);
        }
    }

    @Override
    public List<String> list(String directory) {
        Path dirPath = resolvePath(directory);
        if (!Files.isDirectory(dirPath)) {
            return Collections.emptyList();
        }

        try (Stream<Path> stream = Files.list(dirPath)) {
            return stream
                    .map(p -> p.getFileName().toString())
                    .toList();
        } catch (IOException e) {
            log.error("Failed to list directory {}: {}", dirPath, e.getMessage());
            return Collections.emptyList();
        }
    }

    // --- Private helpers ---

    /**
     * Resolves a logical path to a physical file path under the data directory.
     * Automatically appends .json.enc extension for data files.
     */
    private Path resolveDataPath(String path) {
        // If path already has an extension, use as-is
        if (path.contains(".")) {
            return resolvePath(path);
        }
        // Default to encrypted JSON
        return resolvePath(path + ENC_EXTENSION);
    }

    private Path resolvePath(String path) {
        Path dataRoot = Paths.get(properties.getDataDir(), "data").toAbsolutePath().normalize();
        Path resolved = dataRoot.resolve(path).normalize();

        // Guard against path traversal
        if (!resolved.startsWith(dataRoot)) {
            throw new RuntimeException("Security violation: path traversal attempt detected for path: " + path);
        }

        return resolved;
    }

    private boolean isEncryptedPath(Path path) {
        return path.toString().endsWith(ENC_EXTENSION);
    }

    private String readFileContent(Path filePath) throws IOException {
        String raw = Files.readString(filePath, StandardCharsets.UTF_8);

        if (isEncryptedPath(filePath)) {
            return encryptionService.decrypt(raw);
        }
        return raw;
    }
}
