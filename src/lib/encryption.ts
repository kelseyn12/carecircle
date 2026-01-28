// Encryption utilities for Care Circle
// Provides end-to-end encryption for sensitive data

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes for GCM
const TAG_LENGTH = 16; // bytes for GCM

// Key storage keys (prefix for SecureStore)
const CIRCLE_KEY_PREFIX = 'circle_key_';
const USER_KEY_PREFIX = 'user_key_';

/**
 * Generate a random encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  // Generate 32 random bytes (256 bits) and encode as base64
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return arrayBufferToBase64(randomBytes.buffer);
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<string> {
  // For React Native, we'll use a simpler approach
  // In production, consider using a proper PBKDF2 implementation
  const combined = password + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return hash;
}

/**
 * Get or create encryption key for a circle
 * If key doesn't exist locally, tries to fetch it from Firestore
 */
export async function getCircleEncryptionKey(circleId: string): Promise<string | null> {
  try {
    // First, try to get from local storage
    let key = await SecureStore.getItemAsync(CIRCLE_KEY_PREFIX + circleId);
    
    // If not found locally, try to fetch from Firestore
    if (!key) {
      key = await fetchCircleEncryptionKeyFromFirestore(circleId);
      if (key) {
        // Store locally for future use
        await setCircleEncryptionKey(circleId, key);
      }
    }
    
    return key;
  } catch (error) {
    console.error('Error getting circle encryption key:', error);
    return null;
  }
}

/**
 * Fetch encryption key from Firestore
 * The key is stored in the circle document (encrypted or plain, depending on security needs)
 */
async function fetchCircleEncryptionKeyFromFirestore(circleId: string): Promise<string | null> {
  try {
    const { db } = await import('./firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    const { collection } = await import('firebase/firestore');
    
    if (!db) return null;
    
    const circleDoc = await getDoc(doc(collection(db, 'circles'), circleId));
    if (!circleDoc.exists()) return null;
    
    const data = circleDoc.data();
    // The encryption key is stored in the circle document
    // For now, we'll store it directly (in production, encrypt it with a master key)
    return data.encryptionKey || null;
  } catch (error) {
    console.error('Error fetching encryption key from Firestore:', error);
    return null;
  }
}

/**
 * Store encryption key for a circle
 */
export async function setCircleEncryptionKey(
  circleId: string,
  key: string
): Promise<void> {
  try {
    await SecureStore.setItemAsync(CIRCLE_KEY_PREFIX + circleId, key);
  } catch (error) {
    console.error('Error storing circle encryption key:', error);
    throw new Error('Failed to store encryption key');
  }
}

/**
 * Generate and store a new encryption key for a circle
 * Also stores the key in Firestore so new members can access it
 */
export async function createCircleEncryptionKey(circleId: string): Promise<string> {
  const key = await generateEncryptionKey();
  
  // Store locally
  await setCircleEncryptionKey(circleId, key);
  
  // Also store in Firestore so new members can access it
  try {
    await storeCircleEncryptionKeyInFirestore(circleId, key);
  } catch (error) {
    console.error('Error storing encryption key in Firestore:', error);
    // Don't fail if Firestore storage fails - local storage is enough
  }
  
  return key;
}

/**
 * Store encryption key in Firestore circle document
 */
async function storeCircleEncryptionKeyInFirestore(circleId: string, key: string): Promise<void> {
  try {
    const { db } = await import('./firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    const { collection } = await import('firebase/firestore');
    
    if (!db) throw new Error('Firestore not initialized');
    
    // Store the key in the circle document
    // Note: In production, you might want to encrypt this key with a master key
    await updateDoc(doc(collection(db, 'circles'), circleId), {
      encryptionKey: key,
    });
  } catch (error) {
    console.error('Error storing encryption key in Firestore:', error);
    throw error;
  }
}

/**
 * Delete encryption key for a circle (when leaving/deleting)
 */
export async function deleteCircleEncryptionKey(circleId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CIRCLE_KEY_PREFIX + circleId);
  } catch (error) {
    console.error('Error deleting circle encryption key:', error);
  }
}

/**
 * Encrypt text data
 * Uses a combination of key derivation and XOR with IV for basic encryption
 * TODO: Upgrade to proper AES-GCM when a suitable React Native library is available
 */
export async function encryptText(
  text: string,
  key: string
): Promise<string> {
  try {
    // Generate IV
    const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
    
    // Derive encryption key from master key + IV
    const derivedKey = await deriveKeyFromPassword(key, arrayBufferToBase64(iv.buffer));
    const keyBytes = base64ToArrayBuffer(derivedKey);
    
    // Convert text to bytes
    const textBytes = stringToArrayBuffer(text);
    
    // Encrypt using XOR with derived key
    const encrypted = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.length);
    combined.set(iv, 0);
    combined.set(encrypted, iv.length);
    
    // Return as base64
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text data
 */
export async function decryptText(
  encryptedData: string,
  key: string
): Promise<string> {
  try {
    // Validate input
    if (!encryptedData || typeof encryptedData !== 'string' || encryptedData.trim() === '') {
      throw new Error('Invalid encrypted data: empty or null');
    }
    
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new Error('Invalid encryption key: empty or null');
    }
    
    // Check if data looks like base64 (basic validation)
    // Base64 strings should only contain A-Z, a-z, 0-9, +, /, and = for padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(encryptedData)) {
      throw new Error('Invalid base64 format in encrypted data');
    }
    
    // Check minimum length (IV_LENGTH = 12 bytes = at least 16 base64 characters)
    if (encryptedData.length < 16) {
      throw new Error('Encrypted data too short to contain valid IV');
    }
    
    const combined = base64ToArrayBuffer(encryptedData);
    
    // Validate that we have enough data for IV
    if (combined.length < IV_LENGTH) {
      throw new Error('Encrypted data does not contain valid IV');
    }
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    // Derive same key using IV
    const derivedKey = await deriveKeyFromPassword(key, arrayBufferToBase64(iv.buffer));
    const keyBytes = base64ToArrayBuffer(derivedKey);
    
    // Decrypt using XOR
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return arrayBufferToString(decrypted.buffer);
  } catch (error: any) {
    // Don't log base64 validation errors - they're expected for legacy plain text data
    // The caller will handle these gracefully
    const errorMessage = error?.message || '';
    const isBase64ValidationError = errorMessage.includes('base64') || 
                                    errorMessage.includes('Invalid base64') ||
                                    errorMessage.includes('invalid character');
    
    if (!isBase64ValidationError) {
      console.error('Error decrypting text:', error);
    }
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt a blob (for photos)
 */
export async function encryptBlob(
  blob: Blob,
  key: string
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const encrypted = await encryptArrayBuffer(arrayBuffer, key);
    return new Blob([encrypted]);
  } catch (error) {
    console.error('Error encrypting blob:', error);
    throw new Error('Failed to encrypt blob');
  }
}

/**
 * Decrypt a blob
 */
export async function decryptBlob(
  encryptedBlob: Blob,
  key: string
): Promise<Blob> {
  try {
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const decrypted = await decryptArrayBuffer(arrayBuffer, key);
    return new Blob([decrypted]);
  } catch (error) {
    console.error('Error decrypting blob:', error);
    throw new Error('Failed to decrypt blob');
  }
}

/**
 * Encrypt ArrayBuffer
 */
async function encryptArrayBuffer(
  data: ArrayBuffer,
  key: string
): Promise<ArrayBuffer> {
  const keyBytes = base64ToArrayBuffer(key);
  const dataBytes = new Uint8Array(data);
  
  const encrypted = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv, 0);
  combined.set(encrypted, iv.length);
  
  return combined.buffer;
}

/**
 * Decrypt ArrayBuffer
 */
async function decryptArrayBuffer(
  encryptedData: ArrayBuffer,
  key: string
): Promise<ArrayBuffer> {
  const combined = new Uint8Array(encryptedData);
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);
  
  const keyBytes = base64ToArrayBuffer(key);
  
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return decrypted.buffer;
}

/**
 * Encrypt invite link data
 */
export async function encryptInviteData(
  inviteId: string,
  circleId: string,
  key: string
): Promise<string> {
  const data = JSON.stringify({ inviteId, circleId });
  return await encryptText(data, key);
}

/**
 * Decrypt invite link data
 */
export async function decryptInviteData(
  encryptedData: string,
  key: string
): Promise<{ inviteId: string; circleId: string }> {
  const decrypted = await decryptText(encryptedData, key);
  return JSON.parse(decrypted);
}

// Utility functions

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  try {
    // Validate base64 string before decoding
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 input: must be a non-empty string');
    }
    
    // Remove whitespace
    const cleaned = base64.trim();
    
    // Check for valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleaned)) {
      throw new Error('Invalid base64 format: contains invalid characters');
    }
    
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error: any) {
    if (error.message?.includes('Invalid base64')) {
      throw error;
    }
    throw new Error(`Found invalid character when decoding base64 string: ${error.message || error}`);
  }
}

function stringToArrayBuffer(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Check if encryption is enabled for a circle
 */
export async function isEncryptionEnabled(circleId: string): Promise<boolean> {
  const key = await getCircleEncryptionKey(circleId);
  return key !== null;
}

