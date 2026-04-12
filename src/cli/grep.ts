import fs from "fs";
import path from "path";
import { Command } from "commander";
import readline from "readline";
import { readVault } from "../vault";
import { decrypt } from "../crypto";

async function promptPassword(label = "Vault password"): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write(`${label}: `);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerGrepCommand(program: Command): void {
  program
    .command("grep <pattern>")
    .description("Search vault entry values by regex pattern")
    .option("-k, --keys-only", "Print only matching keys")
    .option("-i, --ignore-case", "Case-insensitive matching")
    .option("-v, --invert", "Show entries that do NOT match")
    .action(async (pattern: string, opts) => {
      const password = await promptPassword();
      const vault = await readVault(password);

      const flags = opts.ignoreCase ? "i" : "";
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, flags);
      } catch {
        console.error(`Invalid regex pattern: ${pattern}`);
        process.exit(1);
      }

      const entries = Object.entries(vault.entries ?? {});
      const matched = entries.filter(([, entry]) => {
        const value = entry.value ?? "";
        const matches = regex.test(value);
        return opts.invert ? !matches : matches;
      });

      if (matched.length === 0) {
        console.log("No matching entries found.");
        return;
      }

      for (const [key, entry] of matched) {
        if (opts.keysOnly) {
          console.log(key);
        } else {
          console.log(`${key}=${entry.value}`);
        }
      }
    });
}
