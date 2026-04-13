import { Command } from "commander";
import * as readline from "readline";
import { readVault } from "../vault";

function promptPassword(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(query);
    process.stdin.setRawMode?.(true);
    let password = "";
    process.stdin.on("data", (ch) => {
      const char = ch.toString();
      if (char === "\n" || char === "\r") {
        process.stdin.setRawMode?.(false);
        process.stdout.write("\n");
        rl.close();
        resolve(password);
      } else if (char === "\u0003") {
        process.exit();
      } else {
        password += char;
      }
    });
  });
}

export function registerPeekCommand(program: Command): void {
  program
    .command("peek <key>")
    .description("Preview the value of a key with optional masking")
    .option("-r, --reveal", "Show the full value unmasked", false)
    .option("-n, --chars <n>", "Number of visible trailing characters", "4")
    .action(async (key: string, options: { reveal: boolean; chars: string }) => {
      const password = await promptPassword("Enter vault password: ");
      let vault;
      try {
        vault = await readVault(password);
      } catch {
        console.error("Failed to read vault. Wrong password or vault not initialised.");
        process.exit(1);
      }

      const entry = vault[key];
      if (!entry) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }

      const value = entry.value;

      if (options.reveal) {
        console.log(`${key}=${value}`);
        return;
      }

      const visible = parseInt(options.chars, 10);
      const masked =
        value.length <= visible
          ? "*".repeat(value.length)
          : "*".repeat(value.length - visible) + value.slice(-visible);

      console.log(`${key}=${masked}`);
    });
}
