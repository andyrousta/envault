import { Command } from 'commander';
import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    let input = '';
    process.stdin.on('data', (ch) => {
      const c = ch.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        console.log();
        resolve(input);
      } else {
        input += c;
      }
    });
  });
}

export function registerSampleCommand(program: Command): void {
  program
    .command('sample <count>')
    .description('Display a random sample of vault entries')
    .option('--keys-only', 'Show only keys, not values')
    .action(async (countArg: string, opts: { keysOnly?: boolean }) => {
      const count = parseInt(countArg, 10);
      if (isNaN(count) || count < 1) {
        console.error('Error: count must be a positive integer');
        process.exit(1);
      }
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      const password = await promptPassword('Password: ');
      let entries: Record<string, string>;
      try {
        entries = await readVault(password);
      } catch {
        console.error('Error: incorrect password or corrupted vault.');
        process.exit(1);
      }
      const keys = Object.keys(entries);
      if (keys.length === 0) {
        console.log('Vault is empty.');
        return;
      }
      const shuffled = keys.sort(() => Math.random() - 0.5);
      const sampled = shuffled.slice(0, Math.min(count, keys.length));
      for (const key of sampled) {
        if (opts.keysOnly) {
          console.log(key);
        } else {
          console.log(`${key}=${entries[key]}`);
        }
      }
    });
}
