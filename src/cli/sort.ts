import { Command } from "commander";
import { readVault, writeVault, vaultExists } from "../vault";
import { decrypt, encrypt } from "../crypto";
import * as readline from "readline";

async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = "";
    process.stdin.on("data", (char) => {
      const c = char.toString();
      if (c === "\n" || c === "\r") {
        process.stdin.setRawMode?.(false);
        process.stdout.write("\n");
        rl.close();
        resolve(password);
      } else if (c === "\u0003") {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerSortCommand(program: Command): void {
  program
    .command("sort")
    .description("Sort vault entries alphabetically by key")
    .option("--desc", "Sort in descending order")
    .option("--by-value", "Sort by value instead of key")
    .action(async (opts) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Password: ");
      try {
        const vault = await readVault(password);
        const entries = Object.entries(vault);
        entries.sort(([aKey, aVal], [bKey, bVal]) => {
          const a = opts.byValue ? String(aVal) : aKey;
          const b = opts.byValue ? String(bVal) : bKey;
          return opts.desc ? b.localeCompare(a) : a.localeCompare(b);
        });
        const sorted = Object.fromEntries(entries);
        await writeVault(sorted, password);
        console.log(`Sorted ${entries.length} entries ${opts.desc ? "descending" : "ascending"} by ${opts.byValue ? "value" : "key"}.`);
      } catch {
        console.error("Invalid password or corrupted vault.");
        process.exit(1);
      }
    });
}
