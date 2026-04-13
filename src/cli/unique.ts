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

export function registerUniqueCommand(program: Command): void {
  program
    .command("unique")
    .description("List keys whose values are unique (no duplicates)")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const vaultDir = process.cwd();

      if (!vaultExists(vaultDir)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await promptPassword("Password: ");

      let entries: Record<string, string>;
      try {
        const raw = readVault(vaultDir);
        const decrypted: Record<string, string> = {};
        for (const [key, entry] of Object.entries(raw)) {
          decrypted[key] = await decrypt(entry.value, password);
        }
        entries = decrypted;
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      const valueCounts = new Map<string, string[]>();
      for (const [key, value] of Object.entries(entries)) {
        const existing = valueCounts.get(value) ?? [];
        valueCounts.set(value, [...existing, key]);
      }

      const uniqueKeys = Object.entries(entries)
        .filter(([, value]) => (valueCounts.get(value)?.length ?? 0) === 1)
        .map(([key]) => key)
        .sort();

      if (uniqueKeys.length === 0) {
        console.log("No unique-valued keys found.");
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(uniqueKeys, null, 2));
      } else {
        console.log(`Unique keys (${uniqueKeys.length}):\n`);
        for (const key of uniqueKeys) {
          console.log(`  ${key}`);
        }
      }
    });
}
