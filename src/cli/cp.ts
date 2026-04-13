import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault/vaultFile";
import { getEntry, setEntry } from "../vault/vaultEntry";
import { decrypt, encrypt } from "../crypto";

/**
 * Prompt helper for password/key input (hidden).
 */
async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden && (process.stdout as any).isTTY) {
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      let input = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (char: string) => {
        if (char === "\n" || char === "\r" || char === "\u0003") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (char === "\u007f") {
          input = input.slice(0, -1);
        } else {
          input += char;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

/**
 * Register the `cp` command — copy a vault entry to a new key within the same vault.
 *
 * Unlike `copy` (which copies between vaults), `cp` copies a key within
 * the current vault, optionally overwriting the destination.
 */
export function registerCpCommand(program: Command): void {
  program
    .command("cp <source> <destination>")
    .description("Copy a vault entry from <source> key to <destination> key")
    .option("-f, --force", "Overwrite destination key if it already exists")
    .action(async (source: string, destination: string, opts: { force?: boolean }) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await prompt("Vault password: ", true);

      let vault: string;
      try {
        vault = await readVault(password);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      let entries: Record<string, any>;
      try {
        entries = JSON.parse(vault);
      } catch {
        console.error("Vault data is corrupted.");
        process.exit(1);
      }

      if (!(source in entries)) {
        console.error(`Key "${source}" not found in vault.`);
        process.exit(1);
      }

      if (destination in entries && !opts.force) {
        console.error(
          `Key "${destination}" already exists. Use --force to overwrite.`
        );
        process.exit(1);
      }

      // Deep-copy the source entry to the destination
      entries[destination] = JSON.parse(JSON.stringify(entries[source]));

      try {
        await writeVault(JSON.stringify(entries), password);
        console.log(`Copied "${source}" → "${destination}" successfully.`);
      } catch {
        console.error("Failed to write vault.");
        process.exit(1);
      }
    });
}
