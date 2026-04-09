import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vaultModule from '../vault';

vi.mock('../vault');

const mockVault = {
  version: 1,
  entries: {
    DB_HOST: { encrypted: 'enc1', iv: 'iv1', salt: 'salt1' },
  },
};

describe('deleteCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits with error if no key provided', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    const { deleteCommand } = await import('./delete');
    await expect(deleteCommand('')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if vault does not exist', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(false);
    const { deleteCommand } = await import('./delete');
    await expect(deleteCommand('DB_HOST')).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('exits if key not found in vault', async () => {
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    vi.mocked(vaultModule.readVault).mockReturnValue({ version: 1, entries: {} });
    const { deleteCommand } = await import('./delete');
    await expect(deleteCommand('MISSING_KEY')).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('deletes key when force=true without prompting', async () => {
    const vaultCopy = JSON.parse(JSON.stringify(mockVault));
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    vi.mocked(vaultModule.readVault).mockReturnValue(vaultCopy);
    vi.mocked(vaultModule.writeVault).mockImplementation(() => {});
    const { deleteCommand } = await import('./delete');
    await deleteCommand('DB_HOST', true);
    expect(vaultModule.writeVault).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted'));
  });
});
