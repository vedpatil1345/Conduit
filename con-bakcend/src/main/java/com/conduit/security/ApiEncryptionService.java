package com.conduit.security;

import com.conduit.config.EncryptionConfig;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class ApiEncryptionService {

    private final EncryptionConfig config;
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";

    public ApiEncryptionService(EncryptionConfig config) {
        this.config = config;
    }

    private byte[] getKey() {
        String key = config.getSecretKey();
        if (key == null || key.isEmpty() || key.equals("${CONDUIT_SECRET_KEY}")) {
            System.err.println("[Encryption] WARNING: CONDUIT_SECRET_KEY is not set or invalid! Using empty fallback.");
            key = "";
        } else {
            System.out.println("[Encryption] Using secret key of length: " + key.length());
        }
        
        StringBuilder paddedKey = new StringBuilder(key);
        while (paddedKey.length() < 32) {
            paddedKey.append("0");
        }
        return paddedKey.substring(0, 32).getBytes(StandardCharsets.UTF_8);
    }

    public String encrypt(String plaintext) {
        if (!config.isEnabled()) return plaintext;
        try {
            SecretKeySpec secretKey = new SecretKeySpec(getKey(), "AES");
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            
            byte[] iv = new byte[16];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt payload", e);
        }
    }

    public String decrypt(String base64Combined) {
        if (!config.isEnabled()) return base64Combined;
        try {
            byte[] combined = Base64.getDecoder().decode(base64Combined);
            if (combined.length < 16) {
                throw new IllegalArgumentException("Payload too short to contain IV");
            }
            
            byte[] iv = new byte[16];
            System.arraycopy(combined, 0, iv, 0, 16);
            
            byte[] ciphertext = new byte[combined.length - 16];
            System.arraycopy(combined, 16, ciphertext, 0, ciphertext.length);
            
            SecretKeySpec secretKey = new SecretKeySpec(getKey(), "AES");
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
            byte[] decrypted = cipher.doFinal(ciphertext);
            
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt payload", e);
        }
    }
}
