import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault/vaultFile';
import { setEntry } from '../vault/vaultEntry';

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function importCmd(filePath: string): Promise<void> {
  if (!vaultExists()) {
    console.error('No vault found. Run `envault init` first.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  const entries: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (key) entries[key] = value;
  }

  if (Object.keys(entries).length === 0) {
    console.error('No valid KEY=VALUE pairs found in file.');
    process.exit(1);
  }

  const password = await promptPassword('Vault password: ');

  let vault = readVault(password);

  let imported = 0;
  for (const [key, value] of Object.entries(entries)) {
    vault = setEntry(vault, key, value);
    imported++;
  }

  writeVault(vault, password);
  console.log(`Imported ${imported} variable(s) into vault.`);
}
