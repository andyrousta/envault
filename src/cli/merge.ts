import fs from "fs";
import path from "path";
import { Command } from "commander";
import * as readline from "readline";
import { readVault, writeVault, vaultExists } from "../vault";
import { decrypt, encrypt } from "../crypto";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerMergeCommand(program: Command): void {
  program
    .command("merge <source>")
    .description("Merge entries from another vault file into the current vault")
    .option("--overwrite", "Overwrite existing keys with values from source vault", false)
    .action(async (source: string, options: { overwrite: boolean }) => {
      const sourcePath = path.resolve(source);

      if (!fs.existsSync(sourcePath)) {
        console.error(`Source vault not found: ${sourcePath}`);
        process.exit(1);
      }

      if (!vaultExists()) {
        console.error("No local vault found. Run `envault init` first.");
        process.exit(1);
      }

      const targetPassword = await prompt("Enter password for target vault: ");
      const sourcePassword = await prompt("Enter password for source vault: ");

      let targetVault: Record<string, string>;
      let sourceVault: Record<string, string>;

      try {
        targetVault = await readVault(targetPassword);
      } catch {
        console.error("Failed to decrypt target vault. Wrong password?");
        process.exit(1);
      }

      try {
        const rawSource = fs.readFileSync(sourcePath, "utf-8");
        const parsed = JSON.parse(rawSource);
        sourceVault = JSON.parse(await decrypt(parsed.data, sourcePassword, parsed.iv, parsed.salt));
      } catch {
        console.error("Failed to decrypt source vault. Wrong password?");
        process.exit(1);
      }

      let added = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [key, value] of Object.entries(sourceVault)) {
        if (key in targetVault) {
          if (options.overwrite) {
            targetVault[key] = value;
            overwritten++;
          } else {
            skipped++;
          }
        } else {
          targetVault[key] = value;
          added++;
        }
      }

      await writeVault(targetVault, targetPassword);

      console.log(`Merge complete: ${added} added, ${overwritten} overwritten, ${skipped} skipped.`);
    });
}
