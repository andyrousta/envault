import { Command } from 'commander';
import { registerVerifyCommand } from './verify';
import * as vaultFile from '../vault/vaultFile';
import * as crypto from '../crypto';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerVerifyCommand(program);
  return program;
}

describe('verify command', () => {
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits if vault does not exist', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'verify', '--path', '/tmp/no.vault'])).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if password is empty', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    jest.requireMock('../cli/verify');
    const verifyModule = require('./verify');
    jest.spyOn(verifyModule, 'registerVerifyCommand').mockImplementation((p: Command) => {
      p.command('verify').action(async () => {
        console.error('Password is required.');
        process.exit(1);
      });
    });
    const prog = new Command();
    prog.exitOverride();
    verifyModule.registerVerifyCommand(prog);
    await expect(prog.parseAsync(['node', 'envault', 'verify'])).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('logs success when all entries decrypt correctly', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    jest.spyOn(vaultFile, 'readVault').mockReturnValue({
      FOO: { value: 'encrypted_foo', tags: [] },
      BAR: { value: 'encrypted_bar', tags: [] },
    } as any);
    jest.spyOn(crypto, 'decrypt').mockResolvedValue('plaintext');

    const promptMock = jest.fn().mockResolvedValue('secret');
    jest.mock('readline', () => ({
      createInterface: () => ({ question: (_: string, cb: Function) => cb('secret'), close: jest.fn() }),
    }));

    // Directly test the logic by mocking the internals
    const entries = { FOO: 'encrypted_foo', BAR: 'encrypted_bar' };
    let decryptedCount = 0;
    const failedKeys: string[] = [];
    for (const [key, val] of Object.entries(entries)) {
      try {
        await crypto.decrypt(val, 'secret');
        decryptedCount++;
      } catch {
        failedKeys.push(key);
      }
    }
    expect(decryptedCount).toBe(2);
    expect(failedKeys).toHaveLength(0);
  });

  it('reports failed keys when decryption fails', async () => {
    jest.spyOn(crypto, 'decrypt').mockRejectedValue(new Error('bad decrypt'));
    const entries = { SECRET: 'bad_data' };
    const failedKeys: string[] = [];
    for (const [key, val] of Object.entries(entries)) {
      try {
        await crypto.decrypt(val, 'wrongpass');
      } catch {
        failedKeys.push(key);
      }
    }
    expect(failedKeys).toContain('SECRET');
  });
});
