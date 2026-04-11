import fs from "fs";
import readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerPruneCommand(program: import("commander").Command) {
  program
    .command("prune")
    .description("Remove all expired entries from the vault")
    .option("--dry-run", "Show what would be removed without making changes")
    .option("--vault <path>", "Path to vault file")
    .action(async (opts) => {
      const vaultFile = opts.vault as string | undefined;

      if (!vaultExists(vaultFile)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await prompt("Vault password: ");

      let vault: Record<string, { value: string; tags?: string[]; expiresAt?: string }> = {};
      try {
        vault = await readVault(password, vaultFile);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      const now = Date.now();
      const expired: string[] = [];

      for (const [key, entry] of Object.entries(vault)) {
        if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now) {
          expired.push(key);
        }
      }

      if (expired.length === 0) {
        console.log("No expired entries found.");
        return;
      }

      console.log(`Found ${expired.length} expired entr${expired.length === 1 ? "y" : "ies"}:`);
      for (const key of expired) {
        const exp = vault[key].expiresAt;
        console.log(`  - ${key} (expired: ${exp})`);
      }

      if (opts.dryRun) {
        console.log("Dry run: no changes made.");
        return;
      }

      const confirm = await prompt(`Remove ${expired.length} expired entr${expired.length === 1 ? "y" : "ies"}? (y/N): `);
      if (confirm.trim().toLowerCase() !== "y") {
        console.log("Aborted.");
        return;
      }

      for (const key of expired) {
        delete vault[key];
      }

      await writeVault(vault, password, vaultFile);
      console.log(`Pruned ${expired.length} expired entr${expired.length === 1 ? "y" : "ies"}.`);
    });
}
