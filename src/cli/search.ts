import * as readline from "readline";
import { vaultExists } from "../vault/vaultFile";
import { listEntries } from "../vault/vaultEntry";

export async function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function searchCommand(
  pattern: string | undefined,
  vaultDir: string = process.cwd()
): Promise<void> {
  if (!vaultExists(vaultDir)) {
    console.error("No vault found in current directory. Run `envault init` first.");
    process.exit(1);
  }

  if (!pattern || pattern.trim() === "") {
    console.error("Please provide a search pattern.");
    process.exit(1);
  }

  const password = await promptPassword("Vault password: ");

  let entries: Record<string, string>;
  try {
    entries = await listEntries(vaultDir, password);
  } catch {
    console.error("Failed to decrypt vault. Check your password.");
    process.exit(1);
  }

  const regex = new RegExp(pattern, "i");
  const matchingKeys = Object.keys(entries).filter((key) => regex.test(key));

  if (matchingKeys.length === 0) {
    console.log(`No keys matching "${pattern}" found.`);
    return;
  }

  console.log(`Found ${matchingKeys.length} key(s) matching "${pattern}":\n`);
  for (const key of matchingKeys) {
    console.log(`  ${key}`);
  }
}
