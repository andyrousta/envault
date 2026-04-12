import { Command } from 'commander';
import { registerCountCommand } from './count';
import * as vaultModule from '../vault';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCountCommand(program);
  return program;
}

const mockEntries = [
  { key: 'DB_HOST', value: 'localhost', tags: ['db'] },
  { key: 'DB_PASS', value: 'secret', tags: ['db', 'sensitive'] },
  { key: 'API_KEY', value: 'abc123', tags: ['api'] },
  { key: 'PORT', value: '3000', tags: [] },
];

beforeEach(() => {
  jest.spyOn(vaultModule, 'readVault').mockResolvedValue({ entries: mockEntries } as any);
  jest
    .spyOn(process.stdin, 'on')
    .mockImplementation(function (this: any, event: string, cb: any) {
      if (event === 'data') cb('\n');
      return this;
    });
  jest.spyOn(process.stdin, 'setRawMode').mockReturnValue(process.stdin);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('counts all entries', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(['node', 'envault', 'count']);
  expect(spy).toHaveBeenCalledWith('Total entries: 4');
  spy.mockRestore();
});

test('counts entries by tag', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(['node', 'envault', 'count', '--tag', 'db']);
  expect(spy).toHaveBeenCalledWith('Entries tagged "db": 2');
  spy.mockRestore();
});

test('outputs json when --json flag is set', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(['node', 'envault', 'count', '--json']);
  expect(spy).toHaveBeenCalledWith(JSON.stringify({ count: 4, tag: null }));
  spy.mockRestore();
});

test('outputs json with tag filter', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(['node', 'envault', 'count', '--tag', 'api', '--json']);
  expect(spy).toHaveBeenCalledWith(JSON.stringify({ count: 1, tag: 'api' }));
  spy.mockRestore();
});

test('handles vault read error gracefully', async () => {
  jest.spyOn(vaultModule, 'readVault').mockRejectedValue(new Error('bad password'));
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  const program = makeProgram();
  await expect(program.parseAsync(['node', 'envault', 'count'])).rejects.toThrow('exit');
  expect(errSpy).toHaveBeenCalledWith('Error:', 'bad password');
  errSpy.mockRestore();
  exitSpy.mockRestore();
});
