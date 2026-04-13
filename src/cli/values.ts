import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault } from "../vault";
import { decrypt } from "../crypto";

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerValuesCommand(program: Command): void {
  program
    .command("values")
    .description("List all values (decrypted) stored in the vault")
    .option("-k, --key <key>", "Filter by a specific key")
    .option("--show-keys", "Show key names alongside values", false)
    .action(async (opts) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await promptPassword("Enter vault password: ");

      let vault;
      try {
        vault = readVault(password);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      let entries = Object.entries(vault);

      if (opts.key) {
        entries = entries.filter(([k]) => k === opts.key);
        if (entries.length === 0) {
          console.error(`Key "${opts.key}" not found in vault.`);
          process.exit(1);
        }
      }

      if (entries.length === 0) {
        console.log("Vault is empty.");
        return;
      }

      for (const [key, value] of entries) {
        if (opts.showKeys) {
          console.log(`${key}=${value}`);
        } else {
          console.log(value);
        }
      }
    });
}
