import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault } from "../vault";
import { decrypt } from "../crypto";

function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerHeadCommand(program: Command): void {
  program
    .command("head")
    .description("Display the first N entries from the vault")
    .option("-n, --lines <number>", "Number of entries to show", "5")
    .option("-p, --project <name>", "Project name", "default")
    .action(async (opts) => {
      const project: string = opts.project;
      const count = parseInt(opts.lines, 10);

      if (isNaN(count) || count < 1) {
        console.error("Error: --lines must be a positive integer.");
        process.exit(1);
      }

      if (!vaultExists(project)) {
        console.error(`No vault found for project "${project}". Run 'envault init' first.`);
        process.exit(1);
      }

      const password = await promptPassword("Enter vault password: ");

      let entries: Record<string, string>;
      try {
        entries = await readVault(project, password);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      const keys = Object.keys(entries).slice(0, count);

      if (keys.length === 0) {
        console.log("Vault is empty.");
        return;
      }

      console.log(`Showing first ${keys.length} entr${keys.length === 1 ? "y" : "ies"} of vault "${project}":\n`);
      for (const key of keys) {
        console.log(`  ${key}=${entries[key]}`);
      }
    });
}
