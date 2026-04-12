import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  snapshotFilePath,
  listSnapshots,
  saveSnapshot,
  loadSnapshot,
  deleteSnapshot,
} from "./snapshot";
import * as snapshotModule from "./snapshot";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-snap-"));
  vi.spyOn(snapshotModule, "snapshotsDir" as never, "get").mockReturnValue(
    tmpDir
  );
  vi.spyOn(snapshotModule, "snapshotFilePath").mockImplementation(
    (label: string) => path.join(tmpDir, `${label}.json`)
  );
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("listSnapshots", () => {
  it("returns empty array when directory is empty", () => {
    expect(listSnapshots()).toEqual([]);
  });

  it("lists snapshot names without extension", () => {
    fs.writeFileSync(path.join(tmpDir, "alpha.json"), "{}");
    fs.writeFileSync(path.join(tmpDir, "beta.json"), "{}");
    const result = listSnapshots();
    expect(result).toContain("alpha");
    expect(result).toContain("beta");
  });
});

describe("saveSnapshot / loadSnapshot", () => {
  it("saves and loads a snapshot correctly", () => {
    const data = { entries: [{ key: "FOO", value: "bar" }] };
    saveSnapshot("mysnapshot", data);
    const loaded = loadSnapshot("mysnapshot");
    expect(loaded).toEqual(data);
  });

  it("returns null for a non-existent snapshot", () => {
    expect(loadSnapshot("nonexistent")).toBeNull();
  });
});

describe("deleteSnapshot", () => {
  it("deletes an existing snapshot and returns true", () => {
    saveSnapshot("todelete", {});
    expect(deleteSnapshot("todelete")).toBe(true);
    expect(loadSnapshot("todelete")).toBeNull();
  });

  it("returns false when snapshot does not exist", () => {
    expect(deleteSnapshot("ghost")).toBe(false);
  });
});

describe("snapshotFilePath", () => {
  it("sanitizes label characters", () => {
    vi.restoreAllMocks();
    const fp = snapshotFilePath("my label/unsafe");
    expect(fp).not.toContain(" ");
    expect(fp).not.toContain("/");
  });
});
