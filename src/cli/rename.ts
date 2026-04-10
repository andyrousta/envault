import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault/vaultFile';
import { getEntry, setEntry, deleteEntry } from '../vault/vaultEntry';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export async function renameCommand(
  oldKey: string,
  newKey: string,
  options: { vault?: string; password?: string }
): Promise<void> {
  const vaultFile = options.vault ?? '.envault';

  if (!vaultExists(vaultFile)) {
    console.error(`Vault not found: ${vaultFile}`);
    process.exit(1);
  }

  if (!oldKey || !newKey) {
    console.error('Both <old-key> and <new-key> are required.');
    process.exit(1);
  }

  const password = options.password ?? (await prompt('Vault password: '));

  let vault: Record<string, string>;
  try {
    vault = await readVault(vaultFile, password);
  } catch {
    console.error('Failed to decrypt vault. Wrong password?');
    process.exit(1);
  }

  if (!(oldKey in vault)) {
    console.error(`Key not found: ${oldKey}`);
    process.exit(1);
  }

  if (newKey in vault) {
    const overwrite = await prompt(`Key "${newKey}" already exists. Overwrite? (y/N): `);
    if (overwrite.trim().toLowerCase() !== 'y') {
      console.log('Aborted.');
      return;
    }
  }

  vault[newKey] = vault[oldKey];
  delete vault[oldKey];

  await writeVault(vaultFile, password, vault);
  console.log(`Renamed "${oldKey}" to "${newKey}" successfully.`);
}
