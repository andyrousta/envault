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
import { renameCommand } from './rename';

export function buildCli(): Command {
  const program = new Command();

  program.name('envault').description('Encrypted local environment variable vault').version('1.0.0');

  program.command('init').description('Initialize a new vault').option('-v, --vault <path>', 'Vault file path', '.envault').action((opts) => initCommand(opts));

  program.command('set <key> <value>').description('Set a key in the vault').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((key, value, opts) => setCommand(key, value, opts));

  program.command('get <key>').description('Get a key from the vault').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((key, opts) => getCommand(key, opts));

  program.command('list').description('List all keys in the vault').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((opts) => listCommand(opts));

  program.command('delete <key>').description('Delete a key from the vault').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((key, opts) => deleteCommand(key, opts));

  program.command('export').description('Export vault as .env format').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').option('-o, --output <file>', 'Output file').action((opts) => exportCommand(opts));

  program.command('import <file>').description('Import a .env file into the vault').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((file, opts) => importCommand(file, opts));

  program.command('copy <key>').description('Copy a key value to clipboard').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((key, opts) => copyCommand(key, opts));

  program.command('rotate').description('Rotate the vault password').option('-v, --vault <path>', 'Vault file path', '.envault').action((opts) => rotateCommand(opts));

  program.command('rename <old-key> <new-key>').description('Rename a key in the vault').option('-v, --vault <path>', 'Vault file path', '.envault').option('-p, --password <password>', 'Vault password').action((oldKey, newKey, opts) => renameCommand(oldKey, newKey, opts));

  return program;
}
