import { Command } from 'commander';
import { initCmd } from './init';
import { setCmd } from './set';
import { getCmd } from './get';
import { listCmd } from './list';
import { deleteCmd } from './delete';
import { exportCmd } from './export';
import { importCmd } from './import';
import { copyCmd } from './copy';

const program = new Command();

program
  .name('envault')
  .description('Securely store and sync environment variables using encrypted local vaults')
  .version('1.0.0');

program.command('init').description('Initialize a new vault').action(initCmd);

program.command('set <key> <value>').description('Set a variable in the vault').action(setCmd);

program.command('get <key>').description('Get a variable from the vault').action(getCmd);

program.command('list').description('List all keys in the vault').action(listCmd);

program.command('delete <key>').description('Delete a variable from the vault').action(deleteCmd);

program.command('export').description('Export vault variables to stdout as .env format').action(exportCmd);

program
  .command('import <file>')
  .description('Import variables from a .env file into the vault')
  .action(importCmd);

program
  .command('copy <sourceKey> <destKey>')
  .description('Copy a variable to a new key within the vault')
  .action(copyCmd);

export { program };
