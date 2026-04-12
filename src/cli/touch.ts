import fs from "fs";
import path from "path";
import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault/vaultFile";
import { decrypt, encrypt } from "../crypto";

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerTouchCommand(program: Command): void {
  program
    .command("touch <key>")
    .description("Update the timestamp of an existing vault entry without changing its value")
    .option("--vault <path>", "Path to vault file")
    .action(async (key: string, options: { vault?: string }) => {
      try {
        if (!vaultExists(options.vault)) {
          console.error("No vault found. Run `envault init` first.");
          process.exit(1);
        }

        const password = await prompt("Password: ");
        const raw = readVault(options.vault);
        let entries: Record<string, unknown>;

        try {
          entries = JSON.parse(decrypt(raw.data, raw.salt, raw.iv, password));
        } catch {
          console.error("Incorrect password or corrupted vault.");
          process.exit(1);
        }

        if (!(key in entries)) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        const entry = entries[key] as Record<string, unknown>;
        entry.updatedAt = new Date().toISOString();
        entries[key] = entry;

        const { data, salt, iv } = encrypt(JSON.stringify(entries), password);
        writeVault({ data, salt, iv }, options.vault);

        console.log(`Touched "${key}" — timestamp updated.`);
      } catch (err) {
        console.error("Unexpected error:", (err as Error).message);
        process.exit(1);
      }
    });
}
