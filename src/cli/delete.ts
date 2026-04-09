import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function deleteCommand(key: string, force: boolean = false): Promise<void> {
  if (!key) {
    console.error('Usage: envault delete <KEY>');
    process.exit(1);
  }

  if (!vaultExists()) {
    console.error('No vault found. Run `envault init` to create one.');
    process.exit(1);
  }

  const vault = readVault();

  if (!vault.entries[key]) {
    console.error(`Key "${key}" not found in vault.`);
    process.exit(1);
  }

  if (!force) {
    const confirm = await prompt(`Are you sure you want to delete "${key}"? (y/N): `);
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Aborted.');
      return;
    }
  }

  delete vault.entries[key];
  writeVault(vault);
  console.log(`Deleted "${key}" from vault.`);
}
