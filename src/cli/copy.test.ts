import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';
import * as copyModule from './copy';

const mockVault = { entries: [] };
const mockEntry = { key: 'SRC', value: 'hello' };

describe('copyCmd', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exits if vault does not exist', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(copyModule.copyCmd('SRC', 'DST')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if keys are the same', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(copyModule.copyCmd('KEY', 'KEY')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if source key not found', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    vi.spyOn(copyModule, 'prompt').mockResolvedValue('secret');
    vi.spyOn(vaultFile, 'readVault').mockReturnValue(mockVault as any);
    vi.spyOn(vaultEntry, 'getEntry').mockReturnValue(undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(copyModule.copyCmd('MISSING', 'DST')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('copies key to destination', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    vi.spyOn(copyModule, 'prompt').mockResolvedValue('secret');
    vi.spyOn(vaultFile, 'readVault').mockReturnValue(mockVault as any);
    vi.spyOn(vaultEntry, 'getEntry').mockImplementation((_, key) =>
      key === 'SRC' ? (mockEntry as any) : undefined
    );
    const setEntrySpy = vi.spyOn(vaultEntry, 'setEntry').mockReturnValue(mockVault as any);
    const writeVaultSpy = vi.spyOn(vaultFile, 'writeVault').mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await copyModule.copyCmd('SRC', 'DST');

    expect(setEntrySpy).toHaveBeenCalledWith(mockVault, 'DST', 'hello');
    expect(writeVaultSpy).toHaveBeenCalledWith(mockVault, 'secret');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SRC'));
  });

  it('aborts if destination exists and user declines overwrite', async () => {
    vi.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    vi.spyOn(copyModule, 'prompt')
      .mockResolvedValueOnce('secret')
      .mockResolvedValueOnce('n');
    vi.spyOn(vaultFile, 'readVault').mockReturnValue(mockVault as any);
    vi.spyOn(vaultEntry, 'getEntry').mockReturnValue(mockEntry as any);
    const writeVaultSpy = vi.spyOn(vaultFile, 'writeVault').mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await copyModule.copyCmd('SRC', 'DST');

    expect(writeVaultSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Aborted.');
  });
});
