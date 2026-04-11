import fs from "fs";
import path from "path";
import { Command } from "commander";
import { vaultPath } from "../vault/vaultFile";

export interface HistoryEntry {
  timestamp: string;
  action: string;
  key: string;
  detail?: string;
}

export function historyFilePath(dir: string = process.cwd()): string {
  return path.join(dir, ".envault.history.json");
}

export function readHistory(dir?: string): HistoryEntry[] {
  const filePath = historyFilePath(dir);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(
  entry: Omit<HistoryEntry, "timestamp">,
  dir?: string
): void {
  const filePath = historyFilePath(dir);
  const history = readHistory(dir);
  history.push({ ...entry, timestamp: new Date().toISOString() });
  const MAX_ENTRIES = 200;
  const trimmed = history.slice(-MAX_ENTRIES);
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2));
}

export function registerHistoryCommand(program: Command): void {
  program
    .command("history")
    .description("Show the history of vault actions")
    .option("-n, --limit <number>", "Number of recent entries to show", "20")
    .option("-k, --key <key>", "Filter history by key name")
    .action((opts) => {
      if (!fs.existsSync(vaultPath())) {
        console.error("No vault found in current directory.");
        process.exit(1);
      }
      const limit = parseInt(opts.limit, 10);
      let entries = readHistory();
      if (opts.key) {
        entries = entries.filter((e) => e.key === opts.key);
      }
      const recent = entries.slice(-limit).reverse();
      if (recent.length === 0) {
        console.log("No history entries found.");
        return;
      }
      recent.forEach((e) => {
        const detail = e.detail ? ` (${e.detail})` : "";
        console.log(`[${e.timestamp}] ${e.action.toUpperCase()} ${e.key}${detail}`);
      });
    });
}
