import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault";

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerUnsetCommand(program: Command): void {
  program
    .command("unset <key>")
    .description("Remove an environment variable from the vault")
    .option("--vault <path>", "Path to vault file")
    .action(async (key: string, opts: { vault?: string }) => {
      try {
        if (!vaultExists(opts.vault)) {
          console.error("No vault found. Run `envault init` first.");
          process.exit(1);
        }

        const password = await prompt("Vault password: ");
        const entries = await readVault(password, opts.vault);

        const exists = entries.some((e) => e.key === key);
        if (!exists) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        const confirm = await prompt(`Remove "${key}"? (y/N): `);
        if (confirm.trim().toLowerCase() !== "y") {
          console.log("Aborted.");
          return;
        }

        const updated = entries.filter((e) => e.key !== key);
        await writeVault(updated, password, opts.vault);
        console.log(`Removed "${key}" from vault.`);
      } catch (err: any) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
}
