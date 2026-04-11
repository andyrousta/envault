import { Command } from 'commander';
import { registerCheckCommand } from './check';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCheckCommand(program);
  return program;
}

describe('check command', () => {
  const mockVault = {
    entries: [
      { key: 'API_KEY', value: 'abc123', tags: ['prod'], note: 'main api key' },
      { key: 'DB_URL', value: 'postgres://localhost', tags: [], note: '' },
    ],
  };

  beforeEach(() => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    jest.spyOn(vaultEntry, 'readVault').mockResolvedValue(mockVault as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints key metadata when key exists', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'check', 'API_KEY', '-p', 'secret']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('prod'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('main api key'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('true'));
    consoleSpy.mockRestore();
  });

  it('exits with code 1 when key does not exist', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'check', 'MISSING_KEY', '-p', 'secret'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with code 1 when vault does not exist', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'check', 'API_KEY', '-p', 'secret'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with code 1 on wrong password', async () => {
    jest.spyOn(vaultEntry, 'readVault').mockRejectedValue(new Error('bad decrypt'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'check', 'API_KEY', '-p', 'wrong'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
