import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault } from "../vault";

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function auditCommand(
  vaultFilePath: string,
  options: { json?: boolean } = {}
): Promise<void> {
  if (!fs.existsSync(vaultFilePath)) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  const password = await promptPassword("Enter vault password: ");

  let entries: Record<string, { value: string; tags?: string[] }>;
  try {
    entries = await readVault(vaultFilePath, password);
  } catch {
    console.error("Failed to decrypt vault. Wrong password?");
    process.exit(1);
  }

  const keys = Object.keys(entries);
  const report = {
    totalKeys: keys.length,
    keysWithTags: keys.filter((k) => entries[k].tags && entries[k].tags!.length > 0).length,
    keysWithoutTags: keys.filter((k) => !entries[k].tags || entries[k].tags!.length === 0).length,
    emptyValues: keys.filter((k) => entries[k].value.trim() === "").length,
    duplicateValues: findDuplicateValues(entries),
    keys,
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n=== Vault Audit Report ===${"\n"}`);
    console.log(`Total keys      : ${report.totalKeys}`);
    console.log(`Keys with tags  : ${report.keysWithTags}`);
    console.log(`Keys w/o tags   : ${report.keysWithoutTags}`);
    console.log(`Empty values    : ${report.emptyValues}`);
    if (report.duplicateValues.length > 0) {
      console.log(`Duplicate values: ${report.duplicateValues.join(", ")}`);
    } else {
      console.log(`Duplicate values: none`);
    }
    console.log("");
  }
}

function findDuplicateValues(
  entries: Record<string, { value: string; tags?: string[] }>
): string[] {
  const seen = new Map<string, string[]>();
  for (const [key, entry] of Object.entries(entries)) {
    const v = entry.value;
    if (!seen.has(v)) seen.set(v, []);
    seen.get(v)!.push(key);
  }
  const duplicates: string[] = [];
  for (const [, keys] of seen.entries()) {
    if (keys.length > 1) duplicates.push(...keys);
  }
  return duplicates;
}
