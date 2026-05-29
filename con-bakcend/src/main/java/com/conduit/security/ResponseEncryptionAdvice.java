package com.conduit.security;

import com.conduit.config.EncryptionConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
public class ResponseEncryptionAdvice implements ResponseBodyAdvice<Object> {

    private final ApiEncryptionService encryptionService;
    private final EncryptionConfig encryptionConfig;
    private final ObjectMapper objectMapper;

    public ResponseEncryptionAdvice(ApiEncryptionService encryptionService, EncryptionConfig encryptionConfig, ObjectMapper objectMapper) {
        this.encryptionService = encryptionService;
        this.encryptionConfig = encryptionConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(@NonNull MethodParameter returnType, @NonNull Class<? extends HttpMessageConverter<?>> converterType) {
        // Skip for springdoc openapi, actuator, or error endpoints to keep tooling working
        String className = returnType.getDeclaringClass().getName();
        if (className.contains("springdoc") || className.contains("swagger") || className.contains("BasicErrorController")) {
            return false;
        }
        return encryptionConfig.isEnabled();
    }

    @Override
    public Object beforeBodyWrite(@Nullable Object body, @NonNull MethodParameter returnType, @NonNull MediaType selectedContentType,
                                  @NonNull Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  @NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response) {
        
        // Don't double-encrypt
        if (body instanceof EncryptedPayload) {
            return body;
        }

        try {
            String jsonString;
            boolean isStringResponse = body instanceof String;
            
            if (isStringResponse) {
                jsonString = (String) body;
            } else {
                jsonString = objectMapper.writeValueAsString(body);
            }

            String encryptedBase64 = encryptionService.encrypt(jsonString);
            EncryptedPayload wrapped = new EncryptedPayload(encryptedBase64);

            // If the endpoint explicitly returned a String, Spring will use StringHttpMessageConverter.
            // Returning an Object here will cause a ClassCastException. We must return the raw JSON string instead.
            if (selectedConverterType.getName().contains("StringHttpMessageConverter") || isStringResponse) {
                return objectMapper.writeValueAsString(wrapped);
            }

            return wrapped;

        } catch (Exception e) {
            System.err.println("Warning: Failed to encrypt response body. " + e.getMessage());
            return body;
        }
    }
}
