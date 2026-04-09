import * as fs from 'fs';
import * as readline from 'readline';
import { vaultExists, readVault } from '../vault';
import { decrypt } from '../crypto';

function promptPassword(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function listCommand(showValues: boolean = false): Promise<void> {
  if (!vaultExists()) {
    console.error('No vault found. Run `envault init` to create one.');
    process.exit(1);
  }

  let password: string | undefined;
  if (showValues) {
    password = await promptPassword('Master password: ');
  }

  const vault = readVault();
  const keys = Object.keys(vault.entries);

  if (keys.length === 0) {
    console.log('Vault is empty. Use `envault set <KEY>` to add variables.');
    return;
  }

  console.log(`\nVault contains ${keys.length} variable(s):\n`);

  for (const key of keys.sort()) {
    if (showValues && password) {
      try {
        const entry = vault.entries[key];
        const value = await decrypt(entry.encrypted, entry.iv, entry.salt, password);
        console.log(`  ${key}=${value}`);
      } catch {
        console.error(`  ${key}=<decryption failed>`);
      }
    } else {
      console.log(`  ${key}`);
    }
  }

  console.log();
}
