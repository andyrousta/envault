import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renameCommand } from './rename';
import * as vaultFile from '../vault/vaultFile';

vi.mock('../vault/vaultFile');
vi.mock('./rename', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./rename')>();
  return { ...mod, prompt: vi.fn() };
});

import * as renameModule from './rename';

const mockVault = { API_KEY: 'abc123', DB_URL: 'postgres://localhost' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
  vi.mocked(vaultFile.readVault).mockResolvedValue({ ...mockVault });
  vi.mocked(vaultFile.writeVault).mockResolvedValue(undefined);
  vi.spyOn(renameModule, 'prompt').mockResolvedValue('secret');
});

describe('renameCommand', () => {
  it('renames a key successfully', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await renameCommand('API_KEY', 'NEW_API_KEY', { password: 'secret' });
    expect(vaultFile.writeVault).toHaveBeenCalledWith(
      '.envault',
      'secret',
      expect.objectContaining({ NEW_API_KEY: 'abc123' })
    );
    expect(vaultFile.writeVault).toHaveBeenCalledWith(
      '.envault',
      'secret',
      expect.not.objectContaining({ API_KEY: expect.anything() })
    );
    consoleSpy.mockRestore();
  });

  it('exits if vault does not exist', async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(renameCommand('A', 'B', { password: 'secret' })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if old key does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(renameCommand('MISSING_KEY', 'NEW_KEY', { password: 'secret' })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if decryption fails', async () => {
    vi.mocked(vaultFile.readVault).mockRejectedValue(new Error('decrypt error'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(renameCommand('API_KEY', 'NEW_KEY', { password: 'wrong' })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('aborts if new key exists and user declines overwrite', async () => {
    vi.spyOn(renameModule, 'prompt')
      .mockResolvedValueOnce('secret')
      .mockResolvedValueOnce('n');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await renameCommand('API_KEY', 'DB_URL', {});
    expect(vaultFile.writeVault).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
