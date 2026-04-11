import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  historyFilePath,
  readHistory,
  appendHistory,
  registerHistoryCommand,
} from "./history";
import { Command } from "commander";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-history-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("historyFilePath", () => {
  it("returns path ending in .envault.history.json", () => {
    expect(historyFilePath(tmpDir)).toMatch(/\.envault\.history\.json$/);
  });
});

describe("readHistory", () => {
  it("returns empty array when file does not exist", () => {
    expect(readHistory(tmpDir)).toEqual([]);
  });

  it("returns empty array when file is malformed", () => {
    fs.writeFileSync(historyFilePath(tmpDir), "not json");
    expect(readHistory(tmpDir)).toEqual([]);
  });
});

describe("appendHistory", () => {
  it("creates history file and appends an entry", () => {
    appendHistory({ action: "set", key: "FOO" }, tmpDir);
    const entries = readHistory(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("set");
    expect(entries[0].key).toBe("FOO");
    expect(entries[0].timestamp).toBeTruthy();
  });

  it("appends multiple entries in order", () => {
    appendHistory({ action: "set", key: "A" }, tmpDir);
    appendHistory({ action: "delete", key: "B" }, tmpDir);
    const entries = readHistory(tmpDir);
    expect(entries).toHaveLength(2);
    expect(entries[1].key).toBe("B");
  });

  it("trims to 200 entries", () => {
    for (let i = 0; i < 210; i++) {
      appendHistory({ action: "set", key: `KEY_${i}` }, tmpDir);
    }
    const entries = readHistory(tmpDir);
    expect(entries).toHaveLength(200);
    expect(entries[0].key).toBe("KEY_10");
  });
});

describe("registerHistoryCommand", () => {
  it("registers history command on program", () => {
    const program = new Command();
    registerHistoryCommand(program);
    const cmd = program.commands.find((c) => c.name() === "history");
    expect(cmd).toBeDefined();
  });
});
