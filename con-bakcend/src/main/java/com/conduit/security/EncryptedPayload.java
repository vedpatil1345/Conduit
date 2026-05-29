package com.conduit.security;

public class EncryptedPayload {
    private String data;

    public EncryptedPayload() {}

    public EncryptedPayload(String data) {
        this.data = data;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
