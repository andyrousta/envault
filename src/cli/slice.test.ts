import { Command } from 'commander';
import { registerSliceCommand } from './slice';
import * as vaultModule from '../vault';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSliceCommand(program);
  return program;
}

const mockEntries = {
  ALPHA: { value: 'aaa', tags: [] },
  BETA:  { value: 'bbb', tags: [] },
  GAMMA: { value: 'ccc', tags: [] },
  DELTA: { value: 'ddd', tags: [] },
};

beforeEach(() => {
  jest.spyOn(vaultModule, 'readVault').mockResolvedValue(mockEntries as any);
  jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('slice command', () => {
  it('prints entries in the given range', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.mock('./slice', () => ({
      ...jest.requireActual('./slice'),
      promptPassword: jest.fn().mockResolvedValue('secret'),
    }));

    // Directly invoke the action via the module with mocked prompt
    const sliceModule = await import('./slice');
    jest.spyOn(sliceModule, 'promptPassword').mockResolvedValue('secret');

    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'slice', '0', '1']);

    expect(logSpy).toHaveBeenCalledWith('ALPHA=aaa');
    expect(logSpy).toHaveBeenCalledWith('BETA=bbb');
    expect(logSpy).not.toHaveBeenCalledWith('GAMMA=ccc');
    logSpy.mockRestore();
  });

  it('prints message when range yields no entries', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const sliceModule = await import('./slice');
    jest.spyOn(sliceModule, 'promptPassword').mockResolvedValue('secret');

    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'slice', '99', '100']);

    expect(logSpy).toHaveBeenCalledWith('No entries in the specified range.');
    logSpy.mockRestore();
  });

  it('exits with error on invalid range', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const sliceModule = await import('./slice');
    jest.spyOn(sliceModule, 'promptPassword').mockResolvedValue('secret');

    const program = makeProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'slice', '5', '2'])
    ).rejects.toThrow('exit');

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid range'));
    errSpy.mockRestore();
  });
});
