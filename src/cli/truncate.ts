import fs from "fs";
import path from "path";
import readline from "readline";
import { Command } from "commander";
import { vaultExists, readVault, writeVault } from "../vault";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerTruncateCommand(program: Command): void {
  program
    .command("truncate")
    .description("Remove all entries from the vault, leaving it empty")
    .option("-f, --force", "Skip confirmation prompt")
    .option("--vault <path>", "Path to vault file")
    .action(async (opts) => {
      const vaultFile = opts.vault ?? path.join(process.cwd(), ".envault");

      if (!vaultExists(vaultFile)) {
        console.error("No vault found. Run 'envault init' first.");
        process.exit(1);
      }

      if (!opts.force) {
        const answer = await prompt(
          "This will permanently remove ALL entries from the vault. Type 'yes' to confirm: "
        );
        if (answer.trim().toLowerCase() !== "yes") {
          console.log("Aborted.");
          return;
        }
      }

      const password = await prompt("Master password: ");

      let vault;
      try {
        vault = await readVault(vaultFile, password);
      } catch {
        console.error("Failed to decrypt vault. Check your password.");
        process.exit(1);
      }

      const count = vault.entries.length;
      vault.entries = [];

      await writeVault(vaultFile, password, vault);
      console.log(`Vault truncated. Removed ${count} entr${count === 1 ? "y" : "ies"}.`);
    });
}
