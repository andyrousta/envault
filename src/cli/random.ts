import { Command } from 'commander';
import { readVault, writeVault } from '../vault/vaultFile';
import { setEntry } from '../vault/vaultEntry';
import * as readline from 'readline';

const CHARSETS = {
  alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numeric: '0123456789',
  hex: '0123456789abcdef',
  alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  special: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}',
};

type CharsetKey = keyof typeof CHARSETS;

export function generateRandom(length: number, charset: CharsetKey = 'special'): string {
  const chars = CHARSETS[charset];
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerRandomCommand(program: Command): void {
  program
    .command('random <key>')
    .description('Generate a random value and store it in the vault')
    .option('-l, --length <number>', 'Length of the generated value', '32')
    .option('-c, --charset <type>', 'Character set: alpha, numeric, hex, alphanumeric, special', 'special')
    .option('--print', 'Print the generated value to stdout')
    .action(async (key: string, options: { length: string; charset: string; print: boolean }) => {
      const length = parseInt(options.length, 10);
      if (isNaN(length) || length < 1) {
        console.error('Error: length must be a positive integer');
        process.exit(1);
      }
      const charset = options.charset as CharsetKey;
      if (!CHARSETS[charset]) {
        console.error(`Error: unknown charset "${charset}". Choose from: ${Object.keys(CHARSETS).join(', ')}`);
        process.exit(1);
      }
      const password = await prompt('Master password: ');
      const vault = await readVault(password);
      const value = generateRandom(length, charset);
      const updated = setEntry(vault, key, value);
      await writeVault(updated, password);
      if (options.print) {
        console.log(value);
      } else {
        console.log(`✔ Generated and stored random value for "${key}" (${length} chars, ${charset})`);
      }
    });
}
