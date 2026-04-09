import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { rotateCommand } from './rotate';
import { initCommand } from './init';
import { setCommand } from './set';
import { readVault } from '../vault';

const tmpVaultPath = path.join(os.tmpdir(), `envault-rotate-test-${Date.now()}.json`);

beforeEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
});

afterEach(() => {
  if (fs.existsSync(tmpVaultPath)) fs.unlinkSync(tmpVaultPath);
  vi.restoreAllMocks();
});

describe('rotateCommand', () => {
  it('exits if vault does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.spyOn(require('./rotate'), 'promptPassword').mockResolvedValue('any');
    await expect(rotateCommand('/nonexistent/vault.json')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if old password is wrong', async () => {
    const promptSpy = vi.spyOn(require('./rotate'), 'promptPassword')
      .mockResolvedValueOnce('wrongpassword');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    vi.spyOn(require('../vault'), 'vaultExists').mockReturnValue(true);
    vi.spyOn(require('../vault'), 'readVault').mockReturnValue(null);

    await expect(rotateCommand(tmpVaultPath)).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if new passwords do not match', async () => {
    const promptSpy = vi.spyOn(require('./rotate'), 'promptPassword')
      .mockResolvedValueOnce('oldpass')
      .mockResolvedValueOnce('newpass1')
      .mockResolvedValueOnce('newpass2');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    vi.spyOn(require('../vault'), 'vaultExists').mockReturnValue(true);
    vi.spyOn(require('../vault'), 'readVault').mockReturnValue({ KEY: 'encrypted' });

    await expect(rotateCommand(tmpVaultPath)).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if new password is empty', async () => {
    const promptSpy = vi.spyOn(require('./rotate'), 'promptPassword')
      .mockResolvedValueOnce('oldpass')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    vi.spyOn(require('../vault'), 'vaultExists').mockReturnValue(true);
    vi.spyOn(require('../vault'), 'readVault').mockReturnValue({ KEY: 'encrypted' });

    await expect(rotateCommand(tmpVaultPath)).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('re-encrypts all entries with new password', async () => {
    const { encrypt, decrypt } = await import('../crypto');
    const oldPass = 'oldpassword123';
    const newPass = 'newpassword456';
    const entries: Record<string, string> = { API_KEY: encrypt('secret', oldPass), DB_URL: encrypt('postgres://localhost', oldPass) };

    vi.spyOn(require('./rotate'), 'promptPassword')
      .mockResolvedValueOnce(oldPass)
      .mockResolvedValueOnce(newPass)
      .mockResolvedValueOnce(newPass);
    vi.spyOn(require('../vault'), 'vaultExists').mockReturnValue(true);
    vi.spyOn(require('../vault'), 'readVault').mockReturnValue(entries);
    const writeSpy = vi.spyOn(require('../vault'), 'writeVault').mockImplementation(() => {});

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await rotateCommand(tmpVaultPath);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const written = writeSpy.mock.calls[0][1] as Record<string, string>;
    expect(decrypt(written['API_KEY'], newPass)).toBe('secret');
    expect(decrypt(written['DB_URL'], newPass)).toBe('postgres://localhost');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 entries re-encrypted'));
  });
});
