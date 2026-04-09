import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runExport } from './export';
import * as vault from '../vault';

vi.mock('./export', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./export')>();
  return {
    ...mod,
    promptPassword: vi.fn(),
  };
});

vi.mock('../vault');

describe('export command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export entries in dotenv format by default', async () => {
    const { promptPassword } = await import('./export');
    vi.mocked(promptPassword).mockResolvedValue('secret');
    vi.mocked(vault.listEntries).mockResolvedValue([
      { key: 'API_KEY', value: 'abc123' },
      { key: 'DB_URL', value: 'postgres://localhost' },
    ]);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runExport('dotenv');

    expect(consoleSpy).toHaveBeenCalledWith('API_KEY=abc123');
    expect(consoleSpy).toHaveBeenCalledWith('DB_URL=postgres://localhost');

    consoleSpy.mockRestore();
  });

  it('should export entries in JSON format', async () => {
    const { promptPassword } = await import('./export');
    vi.mocked(promptPassword).mockResolvedValue('secret');
    vi.mocked(vault.listEntries).mockResolvedValue([
      { key: 'API_KEY', value: 'abc123' },
    ]);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runExport('json');

    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ API_KEY: 'abc123' }, null, 2)
    );

    consoleSpy.mockRestore();
  });

  it('should notify when vault is empty', async () => {
    const { promptPassword } = await import('./export');
    vi.mocked(promptPassword).mockResolvedValue('secret');
    vi.mocked(vault.listEntries).mockResolvedValue([]);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runExport();

    expect(consoleSpy).toHaveBeenCalledWith('No entries found in vault.');

    consoleSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    const { promptPassword } = await import('./export');
    vi.mocked(promptPassword).mockResolvedValue('bad-pass');
    vi.mocked(vault.listEntries).mockRejectedValue(new Error('Decryption failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runExport();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Decryption failed')
    );

    consoleSpy.mockRestore();
  });
});
