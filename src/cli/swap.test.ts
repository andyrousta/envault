import { Command } from 'commander';
import { registerSwapCommand } from './swap';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSwapCommand(program);
  return program;
}

const mockEntries = [
  { key: 'HOST', value: 'localhost', tags: [] },
  { key: 'PORT', value: '5432', tags: [] },
];

beforeEach(() => {
  jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
  jest.spyOn(vaultEntry, 'readVault' as any).mockResolvedValue(JSON.parse(JSON.stringify(mockEntries)));
  jest.spyOn(vaultEntry, 'writeVault' as any).mockResolvedValue(undefined);
  jest.spyOn(require('./swap'), 'prompt').mockResolvedValue('secret');
});

afterEach(() => jest.restoreAllMocks());

describe('swap command', () => {
  it('swaps values of two existing keys', async () => {
    const written: any[] = [];
    jest.spyOn(vaultEntry, 'writeVault' as any).mockImplementation(async (entries: any) => {
      written.push(...entries);
    });

    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'swap', 'HOST', 'PORT']);

    const host = written.find((e) => e.key === 'HOST');
    const port = written.find((e) => e.key === 'PORT');
    expect(host.value).toBe('5432');
    expect(port.value).toBe('localhost');
  });

  it('exits if vault does not exist', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'swap', 'HOST', 'PORT'])).rejects.toThrow();
  });

  it('exits when swapping a key with itself', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'envault', 'swap', 'HOST', 'HOST'])).rejects.toThrow();
    exitSpy.mockRestore();
  });

  it('exits if a key does not exist', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'envault', 'swap', 'HOST', 'MISSING'])).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
