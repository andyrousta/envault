import fs from "fs";
import path from "path";
import { Command } from "commander";
import { readVault } from "../vault";
import { vaultPath } from "../vault/vaultFile";

export const snapshotsDir = path.join(
  path.dirname(vaultPath),
  ".envault-snapshots"
);

export function snapshotFilePath(label: string): string {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(snapshotsDir, `${safe}.json`);
}

export function listSnapshots(): string[] {
  if (!fs.existsSync(snapshotsDir)) return [];
  return fs
    .readdirSync(snapshotsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function saveSnapshot(label: string, data: object): void {
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }
  fs.writeFileSync(snapshotFilePath(label), JSON.stringify(data, null, 2));
}

export function loadSnapshot(label: string): object | null {
  const fp = snapshotFilePath(label);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

export function deleteSnapshot(label: string): boolean {
  const fp = snapshotFilePath(label);
  if (!fs.existsSync(fp)) return false;
  fs.unlinkSync(fp);
  return true;
}

export function registerSnapshotCommand(program: Command): void {
  const snap = program
    .command("snapshot")
    .description("Manage named snapshots of the vault");

  snap
    .command("save <label>")
    .description("Save current vault state as a snapshot")
    .action((label: string) => {
      const vault = readVault();
      saveSnapshot(label, vault);
      console.log(`Snapshot "${label}" saved.`);
    });

  snap
    .command("list")
    .description("List all saved snapshots")
    .action(() => {
      const snaps = listSnapshots();
      if (snaps.length === 0) {
        console.log("No snapshots found.");
      } else {
        snaps.forEach((s) => console.log(`  - ${s}`));
      }
    });

  snap
    .command("delete <label>")
    .description("Delete a named snapshot")
    .action((label: string) => {
      const removed = deleteSnapshot(label);
      if (removed) {
        console.log(`Snapshot "${label}" deleted.`);
      } else {
        console.error(`Snapshot "${label}" not found.`);
        process.exit(1);
      }
    });
}
