import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  writeVault,
  readVault,
  readVaultRaw,
  vaultExists,
  vaultPath,
  VAULT_FILENAME,
} from './vaultFile';

describe('vaultFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns correct vault path', () => {
    expect(vaultPath(tmpDir)).toBe(path.join(tmpDir, VAULT_FILENAME));
  });

  it('vaultExists returns false when no vault', () => {
    expect(vaultExists(tmpDir)).toBe(false);
  });

  it('writes and reads vault successfully', () => {
    const content = 'SECRET=hello\nANOTHER=world';
    const password = 'my-password';
    writeVault(content, password, tmpDir);
    expect(vaultExists(tmpDir)).toBe(true);
    const result = readVault(password, tmpDir);
    expect(result).toBe(content);
  });

  it('preserves createdAt on update', () => {
    const password = 'pw';
    writeVault('FIRST=1', password, tmpDir);
    const before = readVaultRaw(tmpDir);
    writeVault('SECOND=2', password, tmpDir);
    const after = readVaultRaw(tmpDir);
    expect(after.createdAt).toBe(before.createdAt);
    expect(after.updatedAt).not.toBe(before.updatedAt);
  });

  it('throws on missing vault', () => {
    expect(() => readVault('pw', tmpDir)).toThrow("Run 'envault init' first");
  });

  it('throws on wrong password', () => {
    writeVault('KEY=val', 'correct', tmpDir);
    expect(() => readVault('wrong', tmpDir)).toThrow('Failed to decrypt vault');
  });

  it('stores version 1 in vault file', () => {
    writeVault('X=1', 'pass', tmpDir);
    const raw = readVaultRaw(tmpDir);
    expect(raw.version).toBe(1);
  });
});
