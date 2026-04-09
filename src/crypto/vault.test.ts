import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from './vault';
import * as crypto from 'crypto';

describe('vault crypto', () => {
  const password = 'super-secret-password';
  const plaintext = 'API_KEY=abc123\nDB_URL=postgres://localhost/mydb';

  it('encrypts and decrypts successfully', () => {
    const payload = encrypt(plaintext, password);
    const result = decrypt(payload, password);
    expect(result).toBe(plaintext);
  });

  it('produces different ciphertext on each encryption', () => {
    const payload1 = encrypt(plaintext, password);
    const payload2 = encrypt(plaintext, password);
    expect(payload1.data).not.toBe(payload2.data);
    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.salt).not.toBe(payload2.salt);
  });

  it('throws on wrong password', () => {
    const payload = encrypt(plaintext, password);
    expect(() => decrypt(payload, 'wrong-password')).toThrow();
  });

  it('throws on tampered data', () => {
    const payload = encrypt(plaintext, password);
    payload.data = payload.data.slice(0, -4) + 'ffff';
    expect(() => decrypt(payload, password)).toThrow();
  });

  it('throws on tampered tag', () => {
    const payload = encrypt(plaintext, password);
    payload.tag = payload.tag.slice(0, -4) + 'ffff';
    expect(() => decrypt(payload, password)).toThrow();
  });

  it('derives consistent key from same password and salt', () => {
    const salt = crypto.randomBytes(16);
    const key1 = deriveKey(password, salt);
    const key2 = deriveKey(password, salt);
    expect(key1.toString('hex')).toBe(key2.toString('hex'));
  });

  it('encrypts empty string', () => {
    const payload = encrypt('', password);
    const result = decrypt(payload, password);
    expect(result).toBe('');
  });
});
