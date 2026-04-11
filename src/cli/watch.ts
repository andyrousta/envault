import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { vaultPath, vaultExists } from "../vault/vaultFile";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debounce(fn: () => void, ms: number) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, ms);
}

export function registerWatchCommand(program: Command): void {
  program
    .command("watch")
    .description("Watch the vault file for changes and print a notification")
    .option("-d, --dir <path>", "Directory containing the vault", process.cwd())
    .option("--debounce <ms>", "Debounce delay in milliseconds", "300")
    .action((options) => {
      const dir = path.resolve(options.dir);
      const filePath = vaultPath(dir);
      const debounceMs = parseInt(options.debounce, 10);

      if (!vaultExists(dir)) {
        console.error(`No vault found at: ${filePath}`);
        process.exit(1);
      }

      console.log(`Watching vault for changes: ${filePath}`);
      console.log("Press Ctrl+C to stop.\n");

      const watcher = fs.watch(filePath, { persistent: true }, (eventType) => {
        if (eventType === "change") {
          debounce(() => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] Vault updated.`);
          }, debounceMs);
        }

        if (eventType === "rename") {
          console.warn("Vault file was renamed or deleted. Stopping watcher.");
          watcher.close();
          process.exit(0);
        }
      });

      watcher.on("error", (err) => {
        console.error("Watcher error:", err.message);
        process.exit(1);
      });

      process.on("SIGINT", () => {
        watcher.close();
        console.log("\nWatcher stopped.");
        process.exit(0);
      });
    });
}
