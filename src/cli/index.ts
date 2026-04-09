import { Command } from 'commander';
import { initCommand } from './init';
import { setCommand } from './set';
import { getCommand } from './get';
import { listCommand } from './list';
import { deleteCommand } from './delete';

const program = new Command();

program
  .name('envault')
  .description('Securely store and sync environment variables using encrypted local vaults')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new encrypted vault in the current directory')
  .action(initCommand);

program
  .command('set <key>')
  .description('Set an environment variable in the vault')
  .action((key: string) => setCommand(key));

program
  .command('get <key>')
  .description('Get and decrypt an environment variable from the vault')
  .action((key: string) => getCommand(key));

program
  .command('list')
  .description('List all keys stored in the vault')
  .option('-s, --show-values', 'Decrypt and display values', false)
  .action((opts) => listCommand(opts.showValues));

program
  .command('delete <key>')
  .description('Delete an environment variable from the vault')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action((key: string, opts) => deleteCommand(key, opts.force));

export { program };
