import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import * as readline from "readline";
import { vaultPath, vaultExists } from "../vault/vaultFile";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerResetCommand(program: Command): void {
  program
    .command("reset")
    .description("Delete the vault file and all associated data, resetting envault to a clean state")
    .option("--force", "Skip confirmation prompt")
    .option("--dir <dir>", "Vault directory (defaults to cwd)")
    .action(async (opts) => {
      const dir = opts.dir ?? process.cwd();
      const vaultFile = vaultPath(dir);

      if (!vaultExists(dir)) {
        console.log("No vault found in", dir);
        process.exit(0);
      }

      if (!opts.force) {
        const answer = await prompt(
          `This will permanently delete the vault at ${vaultFile}.\nType "yes" to confirm: `
        );
        if (answer.trim().toLowerCase() !== "yes") {
          console.log("Reset cancelled.");
          process.exit(0);
        }
      }

      const relatedFiles = [
        vaultFile,
        path.join(dir, ".envault.lock"),
        path.join(dir, ".envault.history.json"),
        path.join(dir, ".envault.snapshots.json"),
        path.join(dir, ".envault.mode"),
        path.join(dir, ".envault.profile.json"),
        path.join(dir, ".envault.aliases.json"),
        path.join(dir, ".envault.templates.json"),
      ];

      let removed = 0;
      for (const f of relatedFiles) {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f);
          removed++;
        }
      }

      console.log(`Vault reset complete. Removed ${removed} file(s).`);
    });
}
