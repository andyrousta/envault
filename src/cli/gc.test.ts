import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { runGc } from "./gc";
import { saveSnapshot } from "./snapshot";
import { appendHistory } from "./history";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-gc-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeSnapshots(n: number) {
  for (let i = 0; i < n; i++) {
    saveSnapshot(tmpDir, `snap-${i}`, { entries: [] });
  }
}

function makeHistory(n: number) {
  for (let i = 0; i < n; i++) {
    appendHistory(tmpDir, { action: "set", key: `KEY_${i}`, timestamp: new Date().toISOString() });
  }
}

describe("runGc", () => {
  it("removes snapshots beyond the keep limit", async () => {
    makeSnapshots(8);
    const result = await runGc(tmpDir, { keepSnapshots: 5 });
    expect(result.snapshotsRemoved).toBe(3);
  });

  it("keeps all snapshots when count is within limit", async () => {
    makeSnapshots(3);
    const result = await runGc(tmpDir, { keepSnapshots: 5 });
    expect(result.snapshotsRemoved).toBe(0);
  });

  it("does not delete files in dry-run mode", async () => {
    makeSnapshots(8);
    const result = await runGc(tmpDir, { keepSnapshots: 5, dryRun: true });
    expect(result.snapshotsRemoved).toBe(3);
    // All 8 snapshot files should still exist
    const snapshotDir = path.join(tmpDir, ".envault", "snapshots");
    if (fs.existsSync(snapshotDir)) {
      const files = fs.readdirSync(snapshotDir);
      expect(files.length).toBe(8);
    }
  });

  it("trims history when pruneHistory is true and history exceeds 100", async () => {
    makeHistory(120);
    const result = await runGc(tmpDir, { pruneHistory: true });
    expect(result.historyTrimmed).toBe(true);
  });

  it("does not trim history when it is within 100 entries", async () => {
    makeHistory(50);
    const result = await runGc(tmpDir, { pruneHistory: true });
    expect(result.historyTrimmed).toBe(false);
  });

  it("returns historyTrimmed false when pruneHistory is not set", async () => {
    makeHistory(200);
    const result = await runGc(tmpDir, { pruneHistory: false });
    expect(result.historyTrimmed).toBe(false);
  });

  it("handles missing history file gracefully", async () => {
    const result = await runGc(tmpDir, { pruneHistory: true });
    expect(result.historyTrimmed).toBe(false);
  });
});
