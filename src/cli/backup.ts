import fs from "fs";
import path from "path";
import readline from "readline";
import { vaultExists, readVaultRaw } from "../vault/vaultFile";

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function backupCommand(
  dest: string | undefined,
  options: { yes?: boolean }
): Promise<void> {
  if (!vaultExists()) {
    console.error("No vault found. Run 'envault init' first.");
    process.exit(1);
  }

  const backupDir = dest ?? ".";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `envault-backup-${timestamp}.vault`;
  const backupPath = path.resolve(backupDir, backupFileName);

  if (!options.yes) {
    const confirm = await promptPassword(
      `Backup vault to ${backupPath}? (y/N): `
    );
    if (confirm.trim().toLowerCase() !== "y") {
      console.log("Backup cancelled.");
      return;
    }
  }

  try {
    const raw = readVaultRaw();
    if (!fs.existsSync(path.resolve(backupDir))) {
      fs.mkdirSync(path.resolve(backupDir), { recursive: true });
    }
    fs.writeFileSync(backupPath, raw, "utf-8");
    console.log(`Vault backed up to: ${backupPath}`);
  } catch (err) {
    console.error("Failed to write backup:", (err as Error).message);
    process.exit(1);
  }
}
