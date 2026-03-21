package com.conduit.storage;

import java.util.List;
import java.util.Optional;

/**
 * Abstraction layer for data persistence.
 * <p>
 * {@code JsonFileStorageService} implements this for local mode (encrypted JSON files).
 * {@code PostgresStorageService} implements this for server mode (database).
 * Spring {@code @Profile} switches between them.
 */
public interface StorageService {

    /**
     * Read a single object from the given path.
     *
     * @param path relative path within the data directory (e.g. "users" for users.json.enc)
     * @param type the class to deserialize into
     * @return the deserialized object, or empty if not found
     */
    <T> Optional<T> read(String path, Class<T> type);

    /**
     * Read a list of objects from the given path.
     *
     * @param path relative path within the data directory
     * @param type the element class to deserialize into
     * @return the deserialized list, or empty list if not found
     */
    <T> List<T> readList(String path, Class<T> type);

    /**
     * Write data to the given path. Uses atomic write (tmp + rename).
     *
     * @param path relative path within the data directory
     * @param data the object to serialize and persist
     */
    <T> void write(String path, T data);

    /**
     * Delete the file at the given path.
     *
     * @param path relative path within the data directory
     */
    void delete(String path);

    /**
     * List all entries in a directory.
     *
     * @param directory relative directory path within the data directory
     * @return list of entry names (file basenames without path)
     */
    List<String> list(String directory);
}
