import { Command } from "commander";
import * as readline from "readline";
import { readVault } from "../vault";
import { decrypt } from "../crypto";

async function promptPassword(msg: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(msg, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerTailCommand(program: Command): void {
  program
    .command("tail")
    .description("Show the last N entries from the vault")
    .option("-n, --lines <number>", "Number of entries to show", "10")
    .option("-t, --tag <tag>", "Filter entries by tag")
    .option("-p, --password <password>", "Vault password")
    .action(async (opts) => {
      try {
        const password = opts.password ?? (await promptPassword("Vault password: "));
        const vault = await readVault(password);

        let entries = Object.entries(vault);

        if (opts.tag) {
          entries = entries.filter(([, entry]) =>
            Array.isArray(entry.tags) && entry.tags.includes(opts.tag)
          );
        }

        const n = Math.max(1, parseInt(opts.lines, 10) || 10);
        const tail = entries.slice(-n);

        if (tail.length === 0) {
          console.log("No entries found.");
          return;
        }

        console.log(`Last ${tail.length} entr${tail.length === 1 ? "y" : "ies"}:\n`);
        for (const [key, entry] of tail) {
          const tags = Array.isArray(entry.tags) && entry.tags.length > 0
            ? `  [${entry.tags.join(", ")}]`
            : "";
          const decrypted = await decrypt(entry.value, password);
          console.log(`  ${key}=${decrypted}${tags}`);
        }
      } catch (err: any) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
}
