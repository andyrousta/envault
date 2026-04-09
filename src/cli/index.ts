import { Command } from 'commander';
import { initCommand } from './init';
import { setCommand } from './set';
import { getCommand } from './get';
import { listCommand } from './list';
import { deleteCommand } from './delete';
import { exportCommand } from './export';
import { importCommand } from './import';
import { copyCommand } from './copy';
import { rotateCommand } from './rotate';

const DEFAULT_VAULT = '.envault';

export function buildCli(): Command {
  const program = new Command();

  program.name('envault').description('Securely store and sync environment variables').version('1.0.0');

  program.command('init').description('Initialize a new vault').action(() => initCommand(DEFAULT_VAULT));

  program.command('set <key>').description('Set a variable in the vault').action((key: string) => setCommand(key, DEFAULT_VAULT));

  program.command('get <key>').description('Get a variable from the vault').action((key: string) => getCommand(key, DEFAULT_VAULT));

  program.command('list').description('List all keys in the vault').action(() => listCommand(DEFAULT_VAULT));

  program.command('delete <key>').description('Delete a variable from the vault').action((key: string) => deleteCommand(key, DEFAULT_VAULT));

  program.command('export').description('Export vault entries to a .env file').action(() => exportCommand(DEFAULT_VAULT));

  program.command('import').description('Import entries from a .env file into the vault').action(() => importCommand(DEFAULT_VAULT));

  program.command('copy <key> <dest>').description('Copy a vault entry to another vault').action((key: string, dest: string) => copyCommand(key, DEFAULT_VAULT, dest));

  program.command('rotate').description('Rotate the master password for the vault').action(() => rotateCommand(DEFAULT_VAULT));

  return program;
}
