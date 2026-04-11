import fs from "fs";
import path from "path";
import chalk from "chalk";
import { Command } from "commander";
import { vaultExists, vaultPath, readVaultRaw } from "../vault/vaultFile";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function registerInfoCommand(program: Command): void {
  program
    .command("info")
    .description("Display metadata and statistics about the current vault")
    .action(async () => {
      const vp = vaultPath();

      if (!vaultExists()) {
        console.error(chalk.red("No vault found. Run `envault init` to create one."));
        process.exit(1);
      }

      const raw = readVaultRaw();
      const stat = fs.statSync(vp);
      const entries = Object.keys(raw.entries ?? {});
      const tags = new Set<string>();

      for (const entry of Object.values(raw.entries ?? {})) {
        const e = entry as { tags?: string[] };
        if (e.tags) e.tags.forEach((t) => tags.add(t));
      }

      console.log(chalk.bold("\nVault Info"));
      console.log(chalk.dim("─".repeat(40)));
      console.log(`  ${chalk.cyan("Path:")}          ${vp}`);
      console.log(`  ${chalk.cyan("Size:")}          ${formatBytes(stat.size)}`);
      console.log(`  ${chalk.cyan("Entries:")}       ${entries.length}`);
      console.log(`  ${chalk.cyan("Unique Tags:")}   ${tags.size}`);
      console.log(`  ${chalk.cyan("Last Modified:")} ${stat.mtime.toLocaleString()}`);
      console.log(`  ${chalk.cyan("Created:")}       ${stat.birthtime.toLocaleString()}`);
      console.log(chalk.dim("─".repeat(40)) + "\n");
    });
}
