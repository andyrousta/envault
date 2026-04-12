import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { vaultExists, readVault, writeVault } from "../vault";

type FormatStyle = "upper" | "lower" | "trim";

function applyFormat(key: string, style: FormatStyle): string {
  switch (style) {
    case "upper":
      return key.toUpperCase();
    case "lower":
      return key.toLowerCase();
    case "trim":
      return key.trim().replace(/\s+/g, "_");
    default:
      return key;
  }
}

export function registerFmtCommand(program: Command): void {
  program
    .command("fmt")
    .description("Format all vault entry keys (normalize casing or whitespace)")
    .requiredOption("-p, --password <password>", "Vault password")
    .option(
      "--style <style>",
      "Format style: upper | lower | trim (default: upper)",
      "upper"
    )
    .option("--dry-run", "Preview changes without writing", false)
    .action(async (opts) => {
      const vaultDir = process.cwd();

      if (!vaultExists(vaultDir)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const style = opts.style as FormatStyle;
      if (!["upper", "lower", "trim"].includes(style)) {
        console.error(`Invalid style "${style}". Use: upper, lower, trim`);
        process.exit(1);
      }

      let entries;
      try {
        entries = readVault(vaultDir, opts.password);
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }

      let changed = 0;
      const updated = entries.map((entry) => {
        const newKey = applyFormat(entry.key, style);
        if (newKey !== entry.key) {
          console.log(`  ${entry.key} → ${newKey}`);
          changed++;
          return { ...entry, key: newKey };
        }
        return entry;
      });

      if (changed === 0) {
        console.log("All keys already conform to the selected format.");
        return;
      }

      if (opts.dryRun) {
        console.log(`\nDry run: ${changed} key(s) would be renamed.`);
        return;
      }

      writeVault(vaultDir, opts.password, updated);
      console.log(`\nFormatted ${changed} key(s) using style "${style}".`);
    });
}
