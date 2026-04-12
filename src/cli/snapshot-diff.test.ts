import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { diffVaults, registerSnapshotDiffCommand } from "./snapshot-diff";
import * as snapshotModule from "./snapshot";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSnapshotDiffCommand(program);
  return program;
}

const snapshotData = {
  entries: [
    { key: "FOO", value: "foo1" },
    { key: "BAR", value: "bar1" },
  ],
};

const currentData = {
  entries: [
    { key: "FOO", value: "foo2" },
    { key: "BAZ", value: "baz1" },
  ],
};

describe("diffVaults", () => {
  it("detects added keys", () => {
    const { added } = diffVaults(snapshotData, currentData);
    expect(added).toContain("BAZ");
  });

  it("detects removed keys", () => {
    const { removed } = diffVaults(snapshotData, currentData);
    expect(removed).toContain("BAR");
  });

  it("detects changed keys", () => {
    const { changed } = diffVaults(snapshotData, currentData);
    expect(changed).toContain("FOO");
  });

  it("returns empty diff for identical vaults", () => {
    const result = diffVaults(snapshotData, snapshotData);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });
});

describe("registerSnapshotDiffCommand", () => {
  beforeEach(() => {
    vi.spyOn(snapshotModule, "listSnapshots").mockReturnValue(["mysnap"]);
    vi.spyOn(snapshotModule, "loadSnapshot").mockReturnValue(snapshotData);
    vi.spyOn(vaultModule, "readVault").mockReturnValue(currentData as never);
  });

  afterEach(() => vi.restoreAllMocks());

  it("prints diff output for a known snapshot", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "snapshot-diff", "mysnap"]);
    const output = log.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("+ BAZ");
    expect(output).toContain("- BAR");
    expect(output).toContain("~ FOO");
  });

  it("exits with error for unknown snapshot", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "test", "snapshot-diff", "ghost"])
    ).rejects.toThrow();
  });
});
