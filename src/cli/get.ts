import * as readline from "readline";
import { vaultExists, readVault } from "../vault";
import { getEntry } from "../vault/vaultEntry";

export function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    process.stdout.write(question);
    let input = "";
    process.stdin.setRawMode?.(true);
    process.stdin.once("data", (data) => {
      input = data.toString().trim();
      process.stdout.write("\n");
      process.stdin.setRawMode?.(false);
      rl.close();
      resolve(input);
    });
  });
}

export async function runGet(args: string[]): Promise<void> {
  if (!vaultExists()) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  const key = args[0];

  if (!key) {
    console.error("Usage: envault get <VARIABLE_NAME>");
    process.exit(1);
  }

  const password = await promptPassword("Vault password: ");

  try {
    const vault = await readVault(password);
    const entry = getEntry(vault, key);

    if (entry === undefined) {
      console.error(`Variable "${key}" not found in vault.`);
      process.exit(1);
    }

    console.log(entry);
  } catch (err) {
    console.error("Failed to read vault:", (err as Error).message);
    process.exit(1);
  }
}
