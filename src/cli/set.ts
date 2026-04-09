import * as readline from "readline";
import { vaultExists, readVault, writeVault } from "../vault";
import { setEntry } from "../vault/vaultEntry";

export function prompt(question: string, silent = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (silent) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = "";
      process.stdin.once("data", (data) => {
        input = data.toString().trim();
        process.stdout.write("\n");
        process.stdin.setRawMode?.(false);
        rl.close();
        resolve(input);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

export async function runSet(args: string[]): Promise<void> {
  if (!vaultExists()) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  let key = args[0];
  let value = args[1];

  if (!key) {
    key = await prompt("Variable name: ");
  }

  if (!key || !/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    console.error("Invalid variable name. Use letters, numbers, and underscores.");
    process.exit(1);
  }

  if (value === undefined) {
    value = await prompt(`Value for ${key}: `, true);
  }

  const password = await prompt("Vault password: ", true);

  try {
    const vault = await readVault(password);
    const updated = setEntry(vault, key, value);
    await writeVault(updated, password);
    console.log(`✔ Set ${key} in vault.`);
  } catch (err) {
    console.error("Failed to update vault:", (err as Error).message);
    process.exit(1);
  }
}
