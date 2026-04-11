import { Command } from 'commander';
import { vaultExists, readVault } from '../vault';
import { decrypt } from '../crypto';
import * as readline from 'readline';

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        process.stdout.write('\n');
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerCheckCommand(program: Command): void {
  program
    .command('check <key>')
    .description('Check if a key exists in the vault and show its metadata')
    .option('-p, --password <password>', 'vault password')
    .action(async (key: string, options: { password?: string }) => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` to create one.');
        process.exit(1);
      }

      const password = options.password ?? (await promptPassword('Enter vault password: '));

      try {
        const vault = await readVault(password);
        const entry = vault.entries.find((e) => e.key === key);

        if (!entry) {
          console.log(`Key "${key}" does not exist in the vault.`);
          process.exit(1);
        }

        console.log(`Key:     ${entry.key}`);
        if (entry.tags && entry.tags.length > 0) {
          console.log(`Tags:    ${entry.tags.join(', ')}`);
        }
        if (entry.note) {
          console.log(`Note:    ${entry.note}`);
        }
        console.log(`Exists:  true`);
      } catch {
        console.error('Failed to read vault. Check your password.');
        process.exit(1);
      }
    });
}
