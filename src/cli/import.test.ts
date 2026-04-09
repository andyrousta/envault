import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';
import * as importModule from './import';

const tmpEnvFile = path.join(os.tmpdir(), '.env.test.import');

describe('importCmd', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(tmpEnvFile)) fs.unlinkSync(tmpEnvFile);
  });

  it('exits if vault does not exist', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(importModule.importCmd(tmpEnvFile)).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if file does not exist', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(importModule.importCmd('/nonexistent/.env')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if no valid pairs found', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    fs.writeFileSync(tmpEnvFile, '# comment\n\n');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(importModule.importCmd(tmpEnvFile)).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('imports variables into vault', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    fs.writeFileSync(tmpEnvFile, 'API_KEY=abc123\nDB_URL=postgres://localhost/db\n# comment\n');
    vi.spyOn(importModule, 'promptPassword').mockResolvedValue('secret');
    const mockVault = { entries: [] };
    vi.spyOn(vaultFile, 'readVault').mockReturnValue(mockVault as any);
    const setEntrySpy = vi.spyOn(vaultEntry, 'setEntry').mockReturnValue(mockVault as any);
    const writeVaultSpy = vi.spyOn(vaultFile, 'writeVault').mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await importModule.importCmd(tmpEnvFile);

    expect(setEntrySpy).toHaveBeenCalledTimes(2);
    expect(writeVaultSpy).toHaveBeenCalledWith(mockVault, 'secret');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2'));
  });

  it('handles quoted values', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    fs.writeFileSync(tmpEnvFile, 'TOKEN="my token value"\n');
    vi.spyOn(importModule, 'promptPassword').mockResolvedValue('secret');
    const mockVault = { entries: [] };
    vi.spyOn(vaultFile, 'readVault').mockReturnValue(mockVault as any);
    const setEntrySpy = vi.spyOn(vaultEntry, 'setEntry').mockReturnValue(mockVault as any);
    vi.spyOn(vaultFile, 'writeVault').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await importModule.importCmd(tmpEnvFile);

    expect(setEntrySpy).toHaveBeenCalledWith(mockVault, 'TOKEN', 'my token value');
  });
});
