import { Command } from 'commander';
import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerPinCommand(program: Command): void {
  program
    .command('pin <key>')
    .description('Pin a specific env variable so it is marked as protected from deletion or overwrite')
    .option('--unpin', 'Remove the pin from the variable')
    .action(async (key: string, options: { unpin?: boolean }) => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const password = await prompt('Enter vault password: ');

      let vault;
      try {
        vault = readVault(password);
      } catch {
        console.error('Failed to decrypt vault. Wrong password?');
        process.exit(1);
      }

      const entry = vault.entries.find((e: any) => e.key === key);
      if (!entry) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }

      if (options.unpin) {
        entry.pinned = false;
        writeVault(vault, password);
        console.log(`Key "${key}" has been unpinned.`);
      } else {
        entry.pinned = true;
        writeVault(vault, password);
        console.log(`Key "${key}" has been pinned.`);
      }
    });
}
