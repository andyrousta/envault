import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerRandomCommand, generateRandom } from './random';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';
import * as readline from 'readline';

vi.mock('../vault/vaultFile');
vi.mock('../vault/vaultEntry');
vi.mock('readline');

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerRandomCommand(program);
  return program;
}

describe('generateRandom', () => {
  it('generates a string of the requested length', () => {
    const result = generateRandom(16);
    expect(result).toHaveLength(16);
  });

  it('generates hex-only characters for hex charset', () => {
    const result = generateRandom(64, 'hex');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates numeric-only characters for numeric charset', () => {
    const result = generateRandom(20, 'numeric');
    expect(result).toMatch(/^[0-9]{20}$/);
  });

  it('generates alpha-only characters for alpha charset', () => {
    const result = generateRandom(10, 'alpha');
    expect(result).toMatch(/^[a-zA-Z]{10}$/);
  });
});

describe('random command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockRl = { question: vi.fn((q: string, cb: (a: string) => void) => cb('secret')), close: vi.fn() };
    vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);
    vi.mocked(vaultFile.readVault).mockResolvedValue({ entries: [] } as any);
    vi.mocked(vaultEntry.setEntry).mockReturnValue({ entries: [{ key: 'TOKEN', value: 'abc' }] } as any);
    vi.mocked(vaultFile.writeVault).mockResolvedValue(undefined);
  });

  it('stores a generated value in the vault', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'random', 'TOKEN']);
    expect(vaultFile.readVault).toHaveBeenCalledWith('secret');
    expect(vaultEntry.setEntry).toHaveBeenCalled();
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });

  it('respects --length option', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'random', 'TOKEN', '--length', '8']);
    const setCall = vi.mocked(vaultEntry.setEntry).mock.calls[0];
    expect((setCall[2] as string)).toHaveLength(8);
  });

  it('exits with error for invalid length', async () => {
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'envault', 'random', 'TOKEN', '--length', 'abc'])).rejects.toThrow();
    exitSpy.mockRestore();
  });

  it('exits with error for unknown charset', async () => {
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'envault', 'random', 'TOKEN', '--charset', 'emoji'])).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
