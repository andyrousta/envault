import { Command } from "commander";
import * as readline from "readline";
import { readVault, writeVault } from "../vault/vaultFile";
import { decrypt, encrypt } from "../crypto";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerFlattenCommand(program: Command): void {
  program
    .command("flatten")
    .description("Remove all tags from every entry in the vault")
    .option("--dry-run", "Preview changes without writing")
    .action(async (options) => {
      const password = await prompt("Password: ");

      let vault;
      try {
        vault = await readVault(password);
      } catch {
        console.error("Failed to read vault. Wrong password?");
        process.exit(1);
      }

      const entries = Object.entries(vault);
      if (entries.length === 0) {
        console.log("Vault is empty.");
        return;
      }

      let changed = 0;
      const updated: Record<string, any> = {};

      for (const [key, entry] of entries) {
        const hadTags = Array.isArray((entry as any).tags) && (entry as any).tags.length > 0;
        updated[key] = { ...(entry as any), tags: [] };
        if (hadTags) {
          changed++;
          if (options.dryRun) {
            console.log(`  [dry-run] Would remove tags from: ${key}`);
          }
        }
      }

      if (options.dryRun) {
        console.log(`\n${changed} entry/entries would have tags removed.`);
        return;
      }

      await writeVault(updated, password);
      console.log(`Removed tags from ${changed} entry/entries.`);
    });
}
