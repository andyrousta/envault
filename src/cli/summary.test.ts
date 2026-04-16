import { Command } from 'commander';
import { registerSummaryCommand } from './summary';
import * as vaultFile from '../vault';
import * as crypto from '../crypto';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSummaryCommand(program);
  return program;
}

const mockEntries = [
  { key: 'API_KEY', encrypted: 'enc1', tag: 'production', createdAt: '2024-01-15T10:00:00.000Z' },
  { key: 'DB_URL',  encrypted: 'enc2', tag: 'staging',    createdAt: '2024-11-03T08:42:11.000Z' },
  { key: 'SECRET',  encrypted: 'enc3', tag: null,         createdAt: null },
];

beforeEach(() => {
  jest.spyOn(vaultFile, 'readVault').mockResolvedValue(mockEntries as any);
  jest.spyOn(crypto, 'decrypt').mockResolvedValue('decrypted-value');
  jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
});

afterEach(() => jest.restoreAllMocks());

test('prints summary with correct counts and tags', async () => {
  const { default: readline } = await import('readline');
  jest.spyOn(readline, 'createInterface').mockReturnValue({
    question: (_: string, cb: (a: string) => void) => cb('password'),
    close: jest.fn(),
  } as any);

  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(['node', 'envault', 'summary']);

  const output = log.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain('Total entries : 3');
  expect(output).toContain('Decryptable   : 3');
  expect(output).toContain('production');
  expect(output).toContain('staging');
  expect(output).toContain('2024-01-15');
  expect(output).toContain('2024-11-03');
});

test('handles decrypt failure gracefully', async () => {
  jest.spyOn(crypto, 'decrypt').mockRejectedValue(new Error('bad password'));
  const { default: readline } = await import('readline');
  jest.spyOn(readline, 'createInterface').mockReturnValue({
    question: (_: string, cb: (a: string) => void) => cb('wrong'),
    close: jest.fn(),
  } as any);

  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(['node', 'envault', 'summary']);

  const output = log.mock.calls.map(c => c[0]).join('\n');
  expect(output).toContain('Decryptable   : 0');
});
