import * as fs from 'fs';
import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export async function tagCommand(
  key: string,
  tag: string,
  options: { vault?: string; remove?: boolean } = {}
): Promise<void> {
  const vaultDir = options.vault ?? process.cwd();

  if (!vaultExists(vaultDir)) {
    console.error('No vault found. Run `envault init` first.');
    process.exit(1);
  }

  const password = await prompt('Enter vault password: ');

  let vault: Record<string, { value: string; tags?: string[] }>;
  try {
    vault = await readVault(vaultDir, password);
  } catch {
    console.error('Failed to decrypt vault. Wrong password?');
    process.exit(1);
  }

  if (!(key in vault)) {
    console.error(`Key "${key}" not found in vault.`);
    process.exit(1);
  }

  const entry = vault[key];
  const currentTags: string[] = entry.tags ?? [];

  if (options.remove) {
    const updated = currentTags.filter((t) => t !== tag);
    vault[key] = { ...entry, tags: updated };
    await writeVault(vaultDir, password, vault);
    console.log(`Removed tag "${tag}" from "${key}".`);
  } else {
    if (currentTags.includes(tag)) {
      console.log(`Tag "${tag}" already exists on "${key}".`);
      return;
    }
    vault[key] = { ...entry, tags: [...currentTags, tag] };
    await writeVault(vaultDir, password, vault);
    console.log(`Added tag "${tag}" to "${key}".`);
  }
}
