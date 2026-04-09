import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runGet } from './get';
import * as vaultEntry from '../vault/vaultEntry';

vi.mock('./get', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./get')>();
  return {
    ...mod,
    promptPassword: vi.fn(),
  };
});

vi.mock('../vault/vaultEntry');

describe('get command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve and print an existing key', async () => {
    const { promptPassword } = await import('./get');
    vi.mocked(promptPassword).mockResolvedValue('secret');
    vi.mocked(vaultEntry.getEntry).mockResolvedValue('my-api-value');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runGet('MY_KEY');

    expect(vaultEntry.getEntry).toHaveBeenCalledWith('MY_KEY', 'secret');
    expect(consoleSpy).toHaveBeenCalledWith('MY_KEY=my-api-value');

    consoleSpy.mockRestore();
  });

  it('should print error if key does not exist', async () => {
    const { promptPassword } = await import('./get');
    vi.mocked(promptPassword).mockResolvedValue('secret');
    vi.mocked(vaultEntry.getEntry).mockResolvedValue(null);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runGet('MISSING_KEY');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('MISSING_KEY')
    );

    consoleSpy.mockRestore();
  });

  it('should handle decryption errors gracefully', async () => {
    const { promptPassword } = await import('./get');
    vi.mocked(promptPassword).mockResolvedValue('wrong-password');
    vi.mocked(vaultEntry.getEntry).mockRejectedValue(new Error('Decryption failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runGet('MY_KEY');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Decryption failed')
    );

    consoleSpy.mockRestore();
  });
});
