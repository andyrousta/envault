import { encrypt, decrypt } from '../crypto';
import { readVault, writeVault } from './vaultFile';

export interface VaultEntry {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultData {
  version: number;
  entries: Record<string, VaultEntry>;
}

export async function setEntry(
  vaultPath: string,
  password: string,
  key: string,
  value: string
): Promise<void> {
  const raw = await readVault(vaultPath, password);
  const data: VaultData = raw ?? { version: 1, entries: {} };

  const now = new Date().toISOString();
  const existing = data.entries[key];

  data.entries[key] = {
    key,
    value,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await writeVault(vaultPath, password, data);
}

export async function getEntry(
  vaultPath: string,
  password: string,
  key: string
): Promise<VaultEntry | undefined> {
  const raw = await readVault(vaultPath, password);
  if (!raw) return undefined;
  const data = raw as VaultData;
  return data.entries[key];
}

export async function deleteEntry(
  vaultPath: string,
  password: string,
  key: string
): Promise<boolean> {
  const raw = await readVault(vaultPath, password);
  if (!raw) return false;
  const data = raw as VaultData;
  if (!data.entries[key]) return false;
  delete data.entries[key];
  await writeVault(vaultPath, password, data);
  return true;
}

export async function listEntries(
  vaultPath: string,
  password: string
): Promise<VaultEntry[]> {
  const raw = await readVault(vaultPath, password);
  if (!raw) return [];
  const data = raw as VaultData;
  return Object.values(data.entries);
}
