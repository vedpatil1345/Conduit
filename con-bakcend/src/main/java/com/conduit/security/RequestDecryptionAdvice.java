package com.conduit.security;

import com.conduit.config.EncryptionConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;

@ControllerAdvice
public class RequestDecryptionAdvice extends RequestBodyAdviceAdapter {

    private final ApiEncryptionService encryptionService;
    private final EncryptionConfig encryptionConfig;
    private final ObjectMapper objectMapper;

    public RequestDecryptionAdvice(ApiEncryptionService encryptionService, EncryptionConfig encryptionConfig, ObjectMapper objectMapper) {
        this.encryptionService = encryptionService;
        this.encryptionConfig = encryptionConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(@NonNull MethodParameter methodParameter, @NonNull Type targetType, @NonNull Class<? extends HttpMessageConverter<?>> converterType) {
        return encryptionConfig.isEnabled();
    }

    @Override
    @NonNull
    public HttpInputMessage beforeBodyRead(@NonNull HttpInputMessage inputMessage, @NonNull MethodParameter parameter, @NonNull Type targetType, @NonNull Class<? extends HttpMessageConverter<?>> converterType) throws IOException {
        byte[] bodyBytes = inputMessage.getBody().readAllBytes();

        // Empty bodies are allowed
        if (bodyBytes.length == 0) {
            return inputMessage;
        }

        String bodyString = new String(bodyBytes, StandardCharsets.UTF_8);

        // Encryption is REQUIRED
        if (!bodyString.trim().startsWith("{") || !bodyString.contains("\"data\"")) {
            System.err.println("[Encryption Error] Request body is not wrapped in a JSON 'data' envelope.");
            throw new IOException("Encryption required: request body must be wrapped in an encrypted {\"data\":\"...\"} envelope.");
        }

        EncryptedPayload payload;
        try {
            payload = objectMapper.readValue(bodyString, EncryptedPayload.class);
        } catch (Exception e) {
            System.err.println("[Encryption Error] Failed to parse JSON envelope: " + e.getMessage());
            throw new IOException("Encryption required: failed to parse encrypted envelope.", e);
        }

        if (payload.getData() == null || payload.getData().isBlank()) {
            System.err.println("[Encryption Error] 'data' field is missing or blank.");
            throw new IOException("Encryption required: 'data' field is missing or empty.");
        }

        String decryptedJson;
        try {
            decryptedJson = encryptionService.decrypt(payload.getData());
        } catch (Exception e) {
            System.err.println("[Encryption Error] Decryption failed. Possible key mismatch or corrupted payload. Error: " + e.getMessage());
            throw new IOException("Encryption required: failed to decrypt request body.", e);
        }

        byte[] decryptedBytes = decryptedJson.getBytes(StandardCharsets.UTF_8);
        return new HttpInputMessage() {
            @Override
            @NonNull
            public InputStream getBody() {
                return new ByteArrayInputStream(decryptedBytes);
            }

            @Override
            @NonNull
            public HttpHeaders getHeaders() {
                return inputMessage.getHeaders();
            }
        };
    }
}
