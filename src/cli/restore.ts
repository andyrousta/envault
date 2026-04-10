import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault, writeVault, vaultExists } from "../vault";
import { decrypt } from "../crypto";

async function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function restoreCommand(
  backupFilePath: string,
  options: { password?: string; force?: boolean } = {}
): Promise<void> {
  if (!backupFilePath) {
    console.error("Error: backup file path is required.");
    process.exit(1);
  }

  const resolvedPath = path.resolve(backupFilePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: backup file not found at ${resolvedPath}`);
    process.exit(1);
  }

  const password =
    options.password ?? (await promptPassword("Enter vault password: "));

  let backupData: string;
  try {
    backupData = fs.readFileSync(resolvedPath, "utf-8");
  } catch {
    console.error("Error: could not read backup file.");
    process.exit(1);
  }

  let parsed: { iv: string; data: string };
  try {
    parsed = JSON.parse(backupData);
  } catch {
    console.error("Error: backup file is not valid JSON.");
    process.exit(1);
  }

  let decrypted: string;
  try {
    decrypted = await decrypt(parsed.data, parsed.iv, password);
  } catch {
    console.error("Error: failed to decrypt backup — wrong password?");
    process.exit(1);
  }

  let entries: Record<string, unknown>;
  try {
    entries = JSON.parse(decrypted);
  } catch {
    console.error("Error: decrypted backup content is invalid.");
    process.exit(1);
  }

  if (vaultExists() && !options.force) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const confirm = await new Promise<string>((resolve) => {
      rl.question(
        "A vault already exists. Overwrite it? (yes/no): ",
        (answer) => {
          rl.close();
          resolve(answer.trim().toLowerCase());
        }
      );
    });
    if (confirm !== "yes") {
      console.log("Restore cancelled.");
      return;
    }
  }

  await writeVault(entries as Parameters<typeof writeVault>[0]);
  console.log(`Vault successfully restored from ${resolvedPath}`);
}
