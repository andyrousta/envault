import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { diffCommand } from "./diff";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";
import { encrypt } from "../crypto";

const TEST_PASSWORD = "test-password";

async function makeTempVault(entries: Record<string, string>): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `envault-diff-test-${Date.now()}.json`);
  const raw = await Promise.all(
    Object.entries(entries).map(async ([key, value]) => ({
      key,
      value: await encrypt(value, TEST_PASSWORD),
    }))
  );
  fs.writeFileSync(tmpPath, JSON.stringify(raw), "utf-8");
  return tmpPath;
}

describe("diffCommand", () => {
  beforeEach(() => {
    vi.spyOn(vaultFile, "readVaultRaw").mockResolvedValue(undefined as any);
    vi.spyOn(vaultEntry, "getEntries").mockResolvedValue([
      { key: "FOO", value: "bar", tags: [] },
      { key: "BAZ", value: "qux", tags: [] },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports keys only in other vault", async () => {
    const tmpVault = await makeTempVault({ FOO: "bar", NEW_KEY: "new_val" });
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand(tmpVault, { password: TEST_PASSWORD });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("+ NEW_KEY"));
    fs.unlinkSync(tmpVault);
  });

  it("reports keys only in local vault", async () => {
    const tmpVault = await makeTempVault({ FOO: "bar" });
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand(tmpVault, { password: TEST_PASSWORD });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("- BAZ"));
    fs.unlinkSync(tmpVault);
  });

  it("reports changed values", async () => {
    const tmpVault = await makeTempVault({ FOO: "changed", BAZ: "qux" });
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand(tmpVault, { password: TEST_PASSWORD });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("~ FOO"));
    fs.unlinkSync(tmpVault);
  });

  it("reports no differences when vaults are identical", async () => {
    const tmpVault = await makeTempVault({ FOO: "bar", BAZ: "qux" });
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand(tmpVault, { password: TEST_PASSWORD });
    expect(spy).toHaveBeenCalledWith("No differences found.");
    fs.unlinkSync(tmpVault);
  });

  it("exits with error if other vault path does not exist", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await diffCommand("/nonexistent/path.json", { password: TEST_PASSWORD });
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
