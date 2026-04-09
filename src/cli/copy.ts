import readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault/vaultFile';
import { getEntry, setEntry } from '../vault/vaultEntry';

export function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function copyCmd(sourceKey: string, destKey: string): Promise<void> {
  if (!vaultExists()) {
    console.error('No vault found. Run `envault init` first.');
    process.exit(1);
  }

  if (!sourceKey || !destKey) {
    console.error('Usage: envault copy <SOURCE_KEY> <DEST_KEY>');
    process.exit(1);
  }

  if (sourceKey === destKey) {
    console.error('Source and destination keys must be different.');
    process.exit(1);
  }

  const password = await prompt('Vault password: ');
  const vault = readVault(password);

  const entry = getEntry(vault, sourceKey);
  if (!entry) {
    console.error(`Key "${sourceKey}" not found in vault.`);
    process.exit(1);
  }

  const existing = getEntry(vault, destKey);
  if (existing) {
    const confirm = await prompt(`Key "${destKey}" already exists. Overwrite? (y/N): `);
    if (confirm.toLowerCase() !== 'y') {
      console.log('Aborted.');
      return;
    }
  }

  const updatedVault = setEntry(vault, destKey, entry.value);
  writeVault(updatedVault, password);
  console.log(`Copied "${sourceKey}" to "${destKey}".`);
}
