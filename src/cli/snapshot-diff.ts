import { Command } from "commander";
import readline from "readline";
import { readVault } from "../vault";
import { loadSnapshot, listSnapshots } from "./snapshot";

interface VaultEntry {
  key: string;
  value?: string;
  tags?: string[];
}

interface VaultData {
  entries?: VaultEntry[];
}

function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

export function diffVaults(
  a: VaultData,
  b: VaultData
): { added: string[]; removed: string[]; changed: string[] } {
  const aMap = new Map((a.entries ?? []).map((e) => [e.key, e.value]));
  const bMap = new Map((b.entries ?? []).map((e) => [e.key, e.value]));

  const added = [...bMap.keys()].filter((k) => !aMap.has(k));
  const removed = [...aMap.keys()].filter((k) => !bMap.has(k));
  const changed = [...aMap.keys()].filter(
    (k) => bMap.has(k) && aMap.get(k) !== bMap.get(k)
  );

  return { added, removed, changed };
}

export function registerSnapshotDiffCommand(program: Command): void {
  program
    .command("snapshot-diff <label>")
    .description("Diff current vault against a saved snapshot")
    .action(async (label: string) => {
      const snaps = listSnapshots();
      if (!snaps.includes(label)) {
        console.error(`Snapshot "${label}" not found.`);
        process.exit(1);
      }
      const snapshot = loadSnapshot(label) as VaultData;
      const current = readVault() as VaultData;
      const { added, removed, changed } = diffVaults(snapshot, current);

      if (added.length === 0 && removed.length === 0 && changed.length === 0) {
        console.log("No differences found.");
        return;
      }
      added.forEach((k) => console.log(`+ ${k}`));
      removed.forEach((k) => console.log(`- ${k}`));
      changed.forEach((k) => console.log(`~ ${k}`));
    });
}
