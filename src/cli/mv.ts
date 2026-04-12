import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault/vaultFile";
import { getEntry, setEntry, deleteEntry } from "../vault/vaultEntry";

export async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerMvCommand(program: Command): void {
  program
    .command("mv <source> <destination>")
    .description("Move (rename and optionally re-key) a vault entry to a new key")
    .option("-f, --force", "Overwrite destination if it already exists")
    .action(async (source: string, destination: string, opts: { force?: boolean }) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await prompt("Password: ");

      let vault;
      try {
        vault = await readVault(password);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      const sourceEntry = getEntry(vault, source);
      if (!sourceEntry) {
        console.error(`Key "${source}" not found in vault.`);
        process.exit(1);
      }

      const destEntry = getEntry(vault, destination);
      if (destEntry && !opts.force) {
        console.error(`Key "${destination}" already exists. Use --force to overwrite.`);
        process.exit(1);
      }

      vault = setEntry(vault, destination, sourceEntry.value, {
        tags: sourceEntry.tags,
        note: sourceEntry.note,
      });
      vault = deleteEntry(vault, source);

      await writeVault(vault, password);
      console.log(`Moved "${source}" → "${destination}".`);
    });
}
