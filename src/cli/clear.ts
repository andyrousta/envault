import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerClearCommand(program: Command): void {
  program
    .command("clear")
    .description("Remove all entries from the vault")
    .option("--vault <path>", "path to vault file")
    .option("--force", "skip confirmation prompt")
    .action(async (opts) => {
      if (!vaultExists(opts.vault)) {
        console.error("No vault found. Run 'envault init' first.");
        process.exit(1);
      }

      if (!opts.force) {
        const confirm = await prompt(
          "This will delete ALL entries from the vault. Type 'yes' to confirm: "
        );
        if (confirm.trim().toLowerCase() !== "yes") {
          console.log("Aborted.");
          return;
        }
      }

      const password = await prompt("Master password: ");

      let vault;
      try {
        vault = await readVault(password, opts.vault);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      const count = Object.keys(vault.entries).length;
      vault.entries = {};

      try {
        await writeVault(vault, password, opts.vault);
      } catch {
        console.error("Failed to write vault.");
        process.exit(1);
      }

      console.log(`Cleared ${count} entr${count === 1 ? "y" : "ies"} from the vault.`);
    });
}
