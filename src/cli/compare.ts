import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault } from "../vault";
import { Command } from "commander";

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerCompareCommand(program: Command): void {
  program
    .command("compare <vaultA> <vaultB>")
    .description("Compare two vault files and show key differences")
    .option("--only-keys", "Only show key names, not values")
    .action(async (vaultA: string, vaultB: string, opts: { onlyKeys?: boolean }) => {
      const absA = path.resolve(vaultA);
      const absB = path.resolve(vaultB);

      if (!fs.existsSync(absA)) {
        console.error(`Vault not found: ${absA}`);
        process.exit(1);
      }
      if (!fs.existsSync(absB)) {
        console.error(`Vault not found: ${absB}`);
        process.exit(1);
      }

      const passwordA = await promptPassword(`Password for ${vaultA}: `);
      const passwordB = await promptPassword(`Password for ${vaultB}: `);

      let entriesA: Record<string, string>;
      let entriesB: Record<string, string>;

      try {
        const vaultDataA = readVault(absA, passwordA);
        entriesA = Object.fromEntries(vaultDataA.map((e) => [e.key, e.value]));
      } catch {
        console.error("Failed to decrypt vault A. Wrong password?");
        process.exit(1);
      }

      try {
        const vaultDataB = readVault(absB, passwordB);
        entriesB = Object.fromEntries(vaultDataB.map((e) => [e.key, e.value]));
      } catch {
        console.error("Failed to decrypt vault B. Wrong password?");
        process.exit(1);
      }

      const keysA = new Set(Object.keys(entriesA));
      const keysB = new Set(Object.keys(entriesB));
      const allKeys = new Set([...keysA, ...keysB]);

      let hasDiff = false;

      for (const key of [...allKeys].sort()) {
        if (!keysB.has(key)) {
          console.log(`- [only in A] ${key}${opts.onlyKeys ? "" : ` = ${entriesA[key]}`}`);
          hasDiff = true;
        } else if (!keysA.has(key)) {
          console.log(`+ [only in B] ${key}${opts.onlyKeys ? "" : ` = ${entriesB[key]}`}`);
          hasDiff = true;
        } else if (entriesA[key] !== entriesB[key]) {
          if (opts.onlyKeys) {
            console.log(`~ [changed]   ${key}`);
          } else {
            console.log(`~ [changed]   ${key}`);
            console.log(`    A: ${entriesA[key]}`);
            console.log(`    B: ${entriesB[key]}`);
          }
          hasDiff = true;
        }
      }

      if (!hasDiff) {
        console.log("Vaults are identical.");
      }
    });
}
