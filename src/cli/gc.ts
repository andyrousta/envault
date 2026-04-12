import fs from "fs";
import path from "path";
import { Command } from "commander";
import { snapshotFilePath, listSnapshots, deleteSnapshot } from "./snapshot";
import { historyFilePath, readHistory } from "./history";

export interface GcOptions {
  keepSnapshots?: number;
  pruneHistory?: boolean;
  dryRun?: boolean;
}

export async function runGc(
  vaultDir: string,
  options: GcOptions = {}
): Promise<{ snapshotsRemoved: number; historyTrimmed: boolean }> {
  const keepSnapshots = options.keepSnapshots ?? 5;
  const dryRun = options.dryRun ?? false;
  let snapshotsRemoved = 0;
  let historyTrimmed = false;

  // Prune old snapshots
  const snapshots = listSnapshots(vaultDir);
  if (snapshots.length > keepSnapshots) {
    const toRemove = snapshots.slice(0, snapshots.length - keepSnapshots);
    for (const snap of toRemove) {
      if (!dryRun) {
        deleteSnapshot(vaultDir, snap);
      }
      snapshotsRemoved++;
    }
  }

  // Prune history if requested
  if (options.pruneHistory) {
    const histPath = historyFilePath(vaultDir);
    if (fs.existsSync(histPath)) {
      const history = readHistory(vaultDir);
      const trimmed = history.slice(-100);
      if (trimmed.length < history.length) {
        if (!dryRun) {
          fs.writeFileSync(histPath, JSON.stringify(trimmed, null, 2), "utf-8");
        }
        historyTrimmed = true;
      }
    }
  }

  return { snapshotsRemoved, historyTrimmed };
}

export function registerGcCommand(program: Command): void {
  program
    .command("gc")
    .description("Garbage collect old snapshots and trim history")
    .option("--keep-snapshots <n>", "Number of snapshots to keep", "5")
    .option("--prune-history", "Trim history to the last 100 entries", false)
    .option("--dry-run", "Show what would be removed without deleting", false)
    .action(async (opts) => {
      const vaultDir = process.cwd();
      const keepSnapshots = parseInt(opts.keepSnapshots, 10);
      const result = await runGc(vaultDir, {
        keepSnapshots,
        pruneHistory: opts.pruneHistory,
        dryRun: opts.dryRun,
      });

      if (opts.dryRun) {
        console.log(`[dry-run] Would remove ${result.snapshotsRemoved} snapshot(s).`);
        if (result.historyTrimmed) console.log("[dry-run] History would be trimmed.");
      } else {
        console.log(`Removed ${result.snapshotsRemoved} snapshot(s).`);
        if (result.historyTrimmed) console.log("History trimmed to last 100 entries.");
        if (result.snapshotsRemoved === 0 && !result.historyTrimmed) {
          console.log("Nothing to clean up.");
        }
      }
    });
}
