import * as fs from "fs";
import { Command } from "commander";
import { vaultExists, readVault } from "../vault";
import { vaultPath } from "../vault/vaultFile";

export function promptPassword(message: string): Promise<string> {
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerStatsCommand(program: Command): void {
  program
    .command("stats")
    .description("Display statistics about the current vault")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      const path = vaultPath();

      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` to create one.");
        process.exit(1);
      }

      const password = await promptPassword("Enter vault password: ");

      let entries: Record<string, { value: string; tags?: string[] }>;
      try {
        entries = await readVault(path, password);
      } catch {
        console.error("Failed to read vault. Check your password.");
        process.exit(1);
      }

      const keys = Object.keys(entries);
      const totalKeys = keys.length;

      const tagCounts: Record<string, number> = {};
      for (const entry of Object.values(entries)) {
        for (const tag of entry.tags ?? []) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      }

      const uniqueTags = Object.keys(tagCounts).length;
      const stat = fs.statSync(path);
      const fileSizeBytes = stat.size;

      const stats = {
        totalKeys,
        uniqueTags,
        tags: tagCounts,
        fileSizeBytes,
        vaultPath: path,
      };

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(`Vault path:   ${path}`);
        console.log(`Total keys:   ${totalKeys}`);
        console.log(`Unique tags:  ${uniqueTags}`);
        console.log(`File size:    ${fileSizeBytes} bytes`);
        if (uniqueTags > 0) {
          console.log("Tag breakdown:");
          for (const [tag, count] of Object.entries(tagCounts)) {
            console.log(`  #${tag}: ${count} key(s)`);
          }
        }
      }
    });
}
