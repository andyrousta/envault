import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt, EncryptedPayload } from '../crypto';

export const VAULT_FILENAME = '.envault';

export interface VaultData {
  version: number;
  createdAt: string;
  updatedAt: string;
  payload: EncryptedPayload;
}

export function vaultPath(dir: string = process.cwd()): string {
  return path.join(dir, VAULT_FILENAME);
}

export function vaultExists(dir?: string): boolean {
  return fs.existsSync(vaultPath(dir));
}

export function writeVault(
  envContent: string,
  password: string,
  dir?: string
): void {
  const payload = encrypt(envContent, password);
  const data: VaultData = {
    version: 1,
    createdAt: vaultExists(dir)
      ? readVaultRaw(dir).createdAt
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload,
  };
  fs.writeFileSync(vaultPath(dir), JSON.stringify(data, null, 2), 'utf8');
}

export function readVaultRaw(dir?: string): VaultData {
  const filePath = vaultPath(dir);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No vault found at ${filePath}. Run 'envault init' first.`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as VaultData;
}

export function readVault(password: string, dir?: string): string {
  const data = readVaultRaw(dir);
  try {
    return decrypt(data.payload, password);
  } catch {
    throw new Error('Failed to decrypt vault. Check your password and try again.');
  }
}
