import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault } from "../vault";
import { decrypt } from "../crypto";

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

export async function diffCommand(
  otherVaultPath: string,
  options: { password?: string } = {}
): Promise<void> {
  try {
    const password = options.password ?? (await promptPassword("Master password: "));

    const localEntries = await readVault(password);

    const resolvedOther = path.resolve(otherVaultPath);
    if (!fs.existsSync(resolvedOther)) {
      console.error(`Error: vault file not found at ${resolvedOther}`);
      process.exit(1);
    }

    const rawOther = fs.readFileSync(resolvedOther, "utf-8");
    const otherRaw = JSON.parse(rawOther);
    const otherEntries: Record<string, string> = {};
    for (const entry of otherRaw) {
      const decrypted = await decrypt(entry.value, password);
      otherEntries[entry.key] = decrypted;
    }

    const localKeys = new Set(localEntries.map((e) => e.key));
    const otherKeys = new Set(Object.keys(otherEntries));
    const allKeys = new Set([...localKeys, ...otherKeys]);

    let hasDiff = false;
    for (const key of [...allKeys].sort()) {
      const localVal = localEntries.find((e) => e.key === key)?.value;
      const otherVal = otherEntries[key];
      if (!localKeys.has(key)) {
        console.log(`+ ${key}=${otherVal}  (only in other)`); hasDiff = true;
      } else if (!otherKeys.has(key)) {
        console.log(`- ${key}=${localVal}  (only in local)`); hasDiff = true;
      } else if (localVal !== otherVal) {
        console.log(`~ ${key}\n  local: ${localVal}\n  other: ${otherVal}`); hasDiff = true;
      }
    }

    if (!hasDiff) console.log("No differences found.");
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
