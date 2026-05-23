import { Command } from 'commander';
import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';
import { decrypt, encrypt } from '../crypto';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerSwapCommand(program: Command): void {
  program
    .command('swap <keyA> <keyB>')
    .description('Swap the values of two keys in the vault')
    .action(async (keyA: string, keyB: string) => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      if (keyA === keyB) {
        console.error('Cannot swap a key with itself.');
        process.exit(1);
      }

      const password = await prompt('Password: ');

      let entries;
      try {
        entries = await readVault(password);
      } catch {
        console.error('Failed to decrypt vault. Wrong password?');
        process.exit(1);
      }

      const entryA = entries.find((e) => e.key === keyA);
      const entryB = entries.find((e) => e.key === keyB);

      if (!entryA) {
        console.error(`Key not found: ${keyA}`);
        process.exit(1);
      }
      if (!entryB) {
        console.error(`Key not found: ${keyB}`);
        process.exit(1);
      }

      const tmpValue = entryA.value;
      entryA.value = entryB.value;
      entryB.value = tmpValue;

      await writeVault(entries, password);
      console.log(`Swapped values of '${keyA}' and '${keyB}'.`);
    });
}
