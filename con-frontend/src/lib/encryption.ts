import CryptoJS from "crypto-js";
import { SECRET_KEY } from "@/common/constants/app-constants";

export interface EncryptedPayload {
  data: string;
}

/**
 * Encrypts a JSON payload using AES-CBC padding PKCS7.
 * Prepends the 16-byte IV to the ciphertext before Base64 encoding.
 * The backend Spring layer will expect Base64(IV + CipherText).
 */
export function encryptPayload(data: unknown): string {
  if (!SECRET_KEY) {
    throw new Error("Encryption is enabled but SECRET_KEY is missing. Check your .env.local file.");
  }
  const jsonStr = JSON.stringify(data);
  
  // Ensure the key is exactly 32 bytes (256-bit)
  const keyHex = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(32, '0').substring(0, 32));
  const iv = CryptoJS.lib.WordArray.random(16);
  
  const encrypted = CryptoJS.AES.encrypt(jsonStr, keyHex, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  const combined = iv.clone().concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(combined);
}

/**
 * Decrypts a Base64-encoded encrypted string from the backend.
 * Extracts the 16-byte IV from the front, then decrypts the remainder.
 */
export function decryptPayload(base64Str: string): unknown {
  if (!SECRET_KEY) {
    throw new Error("Decryption is enabled but SECRET_KEY is missing. Check your .env.local file.");
  }
  
  const keyHex = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(32, '0').substring(0, 32));
  const combined = CryptoJS.enc.Base64.parse(base64Str);
  
  // Extract IV (first 16 bytes = 4 words)
  const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16);
  // Extract Ciphertext (remaining bytes)
  const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4), combined.sigBytes - 16);
  
  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });
  
  const decrypted = CryptoJS.AES.decrypt(cipherParams, keyHex, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
  if (!decryptedStr) throw new Error("Decryption failed. Invalid secret key or corrupted payload.");
  return JSON.parse(decryptedStr);
}
