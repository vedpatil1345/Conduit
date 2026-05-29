package com.conduit.common;

import com.conduit.config.ConduitProperties;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256 CBC encryption/decryption service.
 * <p>
 * Ciphertext format: base64( IV (16 bytes) + encrypted_data )
 */
@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;
    private static final int KEY_LENGTH = 256;

    private final ConduitProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public EncryptionService(ConduitProperties properties) {
        this.properties = properties;
    }

    /**
     * Encrypt plaintext using the configured secret key.
     *
     * @param plaintext the text to encrypt
     * @return base64-encoded ciphertext (IV prepended)
     */
    public String encrypt(String plaintext) {
        return encrypt(plaintext, getKeySpec());
    }

    /**
     * Decrypt ciphertext using the configured secret key.
     *
     * @param ciphertext base64-encoded ciphertext (IV prepended)
     * @return decrypted plaintext
     */
    public String decrypt(String ciphertext) {
        return decrypt(ciphertext, getKeySpec());
    }

    /**
     * Encrypt with a specific key (used for double-encryption with pipeline-derived keys).
     */
    public String encrypt(String plaintext, SecretKeySpec keySpec) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // Prepend IV to ciphertext
            byte[] combined = new byte[IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(encrypted, 0, combined, IV_LENGTH, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt with a specific key.
     */
    public String decrypt(String ciphertext, SecretKeySpec keySpec) {
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);

            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            byte[] encrypted = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * Generate a new random AES-256 secret key and return it as a base64 string.
     */
    public static String generateSecretKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
            keyGen.init(KEY_LENGTH);
            SecretKey key = keyGen.generateKey();
            return Base64.getEncoder().encodeToString(key.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate secret key", e);
        }
    }

    private SecretKeySpec getKeySpec() {
        String key = properties.getSecretKey();
        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                "No secret key configured. Run the setup wizard or set conduit.secret-key in conduit.yml");
        }
        byte[] keyBytes = Base64.getDecoder().decode(key);
        return new SecretKeySpec(keyBytes, ALGORITHM);
    }
}
