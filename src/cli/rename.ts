import { Command } from "commander";
import * as readline from "readline";
import { vaultPath, readVault, writeVault } from "../vault/vaultFile";
import { encrypt, decrypt } from "../crypto";

export async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = "";
      process.stdin.once("data", (chunk) => {
        input = chunk.toString().trim();
        process.stdout.write("\n");
        process.stdin.setRawMode?.(false);
        rl.close();
        resolve(input);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

export function registerRenameCommand(program: Command): void {
  program
    .command("rename <oldKey> <newKey>")
    .description("Rename a vault entry key")
    .option("-p, --path <path>", "path to vault file")
    .action(async (oldKey: string, newKey: string, opts: { path?: string }) => {
      const filePath = opts.path ?? vaultPath();
      const password = await prompt("Vault password: ", true);

      let entries: Record<string, string>;
      try {
        entries = await readVault(filePath, password);
      } catch {
        console.error("Failed to read vault. Wrong password or corrupted file.");
        process.exit(1);
      }

      if (!(oldKey in entries)) {
        console.error(`Key "${oldKey}" not found in vault.`);
        process.exit(1);
      }

      if (newKey in entries) {
        console.error(`Key "${newKey}" already exists. Aborting to prevent overwrite.`);
        process.exit(1);
      }

      entries[newKey] = entries[oldKey];
      delete entries[oldKey];

      try {
        await writeVault(filePath, entries, password);
        console.log(`Renamed "${oldKey}" → "${newKey}" successfully.`);
      } catch {
        console.error("Failed to write vault.");
        process.exit(1);
      }
    });
}
