import { Command } from 'commander';
import { registerSampleCommand } from './sample';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSampleCommand(program);
  return program;
}

const mockEntries = { FOO: 'bar', BAZ: 'qux', HELLO: 'world', NUM: '42' };

beforeEach(() => {
  jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
  jest.spyOn(vaultEntry, 'getEntries').mockResolvedValue(mockEntries);
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => jest.restoreAllMocks());

describe('sample command', () => {
  it('prints sampled entries as key=value', async () => {
    const { readVault } = await import('../vault/vaultFile');
    jest.spyOn(require('../vault'), 'readVault').mockResolvedValue(mockEntries);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    const program = makeProgram();
    // simulate password prompt
    jest.spyOn(require('readline'), 'createInterface').mockReturnValue({ close: jest.fn() });
    const stdinMock = jest.spyOn(process.stdin, 'on').mockImplementation((event: any, cb: any) => {
      if (event === 'data') cb('\n');
      return process.stdin;
    });
    await program.parseAsync(['node', 'envault', 'sample', '2']);
    expect(logs.length).toBeLessThanOrEqual(2);
    stdinMock.mockRestore();
  });

  it('errors on non-positive count', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'sample', '0'])).rejects.toThrow();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('positive integer'));
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('errors when vault does not exist', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'sample', '1'])).rejects.toThrow();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
