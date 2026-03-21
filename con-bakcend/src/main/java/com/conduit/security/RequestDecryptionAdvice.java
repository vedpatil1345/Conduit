package com.conduit.security;

import com.conduit.config.EncryptionConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
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
        // Only run if encryption is enabled globally
        return encryptionConfig.isEnabled();
    }

    @Override
    @NonNull
    public HttpInputMessage beforeBodyRead(@NonNull HttpInputMessage inputMessage, @NonNull MethodParameter parameter, @NonNull Type targetType, @NonNull Class<? extends HttpMessageConverter<?>> converterType) throws IOException {
        // We know we must read {"data": "..."}
        // First read the entire incoming stream
        byte[] bodyBytes = inputMessage.getBody().readAllBytes();
        
        // If empty, just return it
        if (bodyBytes.length == 0) {
            return inputMessage;
        }

        String bodyString = new String(bodyBytes, StandardCharsets.UTF_8);

        // Does it look like the wrapper?
        if (bodyString.trim().startsWith("{") && bodyString.contains("\"data\"")) {
            try {
                EncryptedPayload payload = objectMapper.readValue(bodyString, EncryptedPayload.class);
                if (payload.getData() != null) {
                    // Decrypt to raw JSON string
                    String decryptedJson = encryptionService.decrypt(payload.getData());
                    // Replace the input stream with the decrypted JSON
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
            } catch (Exception e) {
                // If it fails to parse as EncryptedPayload or fails to decrypt, log and fallback to original
                System.err.println("Warning: Failed to decrypt request body, falling back to original bytes. " + e.getMessage());
            }
        }

        // Fallback for requests that might not be encrypted (e.g. testing manually without flag)
        return new HttpInputMessage() {
            @Override
            @NonNull
            public InputStream getBody() {
                return new ByteArrayInputStream(bodyBytes);
            }

            @Override
            @NonNull
            public HttpHeaders getHeaders() {
                return inputMessage.getHeaders();
            }
        };
    }
}
