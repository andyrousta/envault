import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault, writeVault } from "../vault";

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerExpireCommand(program: import("commander").Command) {
  program
    .command("expire <key>")
    .description("Set or clear an expiry date on a vault entry")
    .option("--at <date>", "Expiry date in ISO 8601 format (e.g. 2025-12-31)")
    .option("--clear", "Remove expiry from the entry")
    .option("--check", "Check if a key is expired without modifying it")
    .action(async (key: string, options: { at?: string; clear?: boolean; check?: boolean }) => {
      try {
        const password = await prompt("Master password: ");
        const vault = await readVault(password);

        const entry = vault.entries.find((e) => e.key === key);
        if (!entry) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        if (options.check) {
          const expiry = (entry as any).expiresAt;
          if (!expiry) {
            console.log(`"${key}" has no expiry set.`);
          } else {
            const expiryDate = new Date(expiry);
            const now = new Date();
            if (expiryDate <= now) {
              console.log(`"${key}" expired on ${expiryDate.toISOString()}.`);
            } else {
              console.log(`"${key}" expires on ${expiryDate.toISOString()}.`);
            }
          }
          return;
        }

        if (options.clear) {
          delete (entry as any).expiresAt;
          await writeVault(vault, password);
          console.log(`Expiry cleared for "${key}".`);
          return;
        }

        if (!options.at) {
          console.error("Provide --at <date>, --clear, or --check.");
          process.exit(1);
        }

        const expiryDate = new Date(options.at);
        if (isNaN(expiryDate.getTime())) {
          console.error(`Invalid date: "${options.at}". Use ISO 8601 format.`);
          process.exit(1);
        }

        (entry as any).expiresAt = expiryDate.toISOString();
        await writeVault(vault, password);
        console.log(`Expiry for "${key}" set to ${expiryDate.toISOString()}.`);
      } catch (err: any) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
}
