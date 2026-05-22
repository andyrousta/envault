import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerDumpCommand } from './dump';
import * as vaultModule from '../vault';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerDumpCommand(program);
  return program;
}

const mockEntries = [
  { key: 'API_KEY', value: 'abc123' },
  { key: 'DB_URL', value: 'postgres://localhost/dev' },
];

beforeEach(() => {
  jest.spyOn(vaultModule, 'readVault').mockResolvedValue(mockEntries as any);
  jest
    .spyOn(require('readline'), 'createInterface')
    .mockReturnValue({
      question: (_: string, cb: (a: string) => void) => cb('secret'),
      close: jest.fn(),
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('dump command', () => {
  it('prints entries in dotenv format to stdout', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'envault', 'dump']);
    expect(spy).toHaveBeenCalledWith('API_KEY=abc123\nDB_URL=postgres://localhost/dev');
    spy.mockRestore();
  });

  it('prints entries in json format to stdout', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'envault', 'dump', '--format', 'json']);
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output).toEqual({ API_KEY: 'abc123', DB_URL: 'postgres://localhost/dev' });
    spy.mockRestore();
  });

  it('writes dotenv output to a file when --output is given', async () => {
    const tmpFile = path.join(os.tmpdir(), `dump-test-${Date.now()}.env`);
    await makeProgram().parseAsync(['node', 'envault', 'dump', '--output', tmpFile]);
    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content).toContain('API_KEY=abc123');
    expect(content).toContain('DB_URL=postgres://localhost/dev');
    fs.unlinkSync(tmpFile);
  });

  it('writes json output to a file when --format json and --output are given', async () => {
    const tmpFile = path.join(os.tmpdir(), `dump-test-${Date.now()}.json`);
    await makeProgram().parseAsync(['node', 'envault', 'dump', '--format', 'json', '--output', tmpFile]);
    const content = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    expect(content.API_KEY).toBe('abc123');
    fs.unlinkSync(tmpFile);
  });

  it('exits with code 1 on readVault error', async () => {
    jest.spyOn(vaultModule, 'readVault').mockRejectedValue(new Error('bad password'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      makeProgram().parseAsync(['node', 'envault', 'dump'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
