import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../vault';

export async function promptPassword(msg: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(msg, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerSliceCommand(program: Command): void {
  program
    .command('slice <start> <end>')
    .description('Output a slice of vault entries by index range (inclusive)')
    .option('--dir <dir>', 'vault directory')
    .action(async (startArg: string, endArg: string, opts: { dir?: string }) => {
      const start = parseInt(startArg, 10);
      const end = parseInt(endArg, 10);

      if (isNaN(start) || isNaN(end) || start < 0 || end < start) {
        console.error('Invalid range: start and end must be non-negative integers with start <= end');
        process.exit(1);
      }

      const password = await promptPassword('Password: ');

      let entries;
      try {
        entries = await readVault(password, opts.dir);
      } catch {
        console.error('Failed to read vault. Check your password.');
        process.exit(1);
      }

      const keys = Object.keys(entries);
      const slicedKeys = keys.slice(start, end + 1);

      if (slicedKeys.length === 0) {
        console.log('No entries in the specified range.');
        return;
      }

      for (const key of slicedKeys) {
        console.log(`${key}=${entries[key].value}`);
      }
    });
}
