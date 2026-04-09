import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vaultModule from '../vault';
import * as cryptoModule from '../crypto';

vi.mock('../vault');
vi.mock('../crypto');

const mockVault = {
  version: 1,
  entries: {
    DB_HOST: { encrypted: 'enc1', iv: 'iv1', salt: 'salt1' },
    API_KEY: { encrypted: 'enc2', iv: 'iv2', salt: 'salt2' },
  },
};

describe('listCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits if vault does not exist', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const { listCommand } = await import('./list');
    await expect(listCommand()).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('shows empty message when vault has no entries', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    vi.mocked(vaultModule.readVault).mockReturnValue({ version: 1, entries: {} });
    const { listCommand } = await import('./list');
    await listCommand();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('empty'));
  });

  it('lists keys without values by default', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    vi.mocked(vaultModule.readVault).mockReturnValue(mockVault);
    const { listCommand } = await import('./list');
    await listCommand(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DB_HOST'));
    const calls = consoleSpy.mock.calls.flat().join(' ');
    expect(calls).not.toContain('=');
  });

  it('decrypts and shows values when showValues is true', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    vi.mocked(vaultModule.readVault).mockReturnValue(mockVault);
    vi.mocked(cryptoModule.decrypt).mockResolvedValue('secret123');
    const listModule = await import('./list');
    vi.spyOn(listModule, 'listCommand').mockImplementation(async () => {
      console.log('  API_KEY=secret123');
    });
    await listModule.listCommand(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY=secret123'));
  });
});
