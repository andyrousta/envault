import fs from "fs";
import path from "path";
import os from "os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  lockFilePath,
  isLocked,
  acquireLock,
  releaseLock,
  assertNotLocked,
} from "./lock";

vi.mock("../vault/vaultFile", () => ({
  vaultPath: () => path.join(tmpDir, ".envault"),
  vaultExists: () => true,
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-lock-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("lockFilePath", () => {
  it("returns the lock file path inside the vault dir", () => {
    const result = lockFilePath(tmpDir);
    expect(result).toBe(path.join(tmpDir, ".envault.lock"));
  });
});

describe("isLocked", () => {
  it("returns false when lock file does not exist", () => {
    expect(isLocked(tmpDir)).toBe(false);
  });

  it("returns true when lock file exists", () => {
    fs.writeFileSync(path.join(tmpDir, ".envault.lock"), "");
    expect(isLocked(tmpDir)).toBe(true);
  });
});

describe("acquireLock", () => {
  it("creates the lock file", () => {
    acquireLock(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, ".envault.lock"))).toBe(true);
  });

  it("throws if vault is already locked", () => {
    acquireLock(tmpDir);
    expect(() => acquireLock(tmpDir)).toThrow("already locked");
  });
});

describe("releaseLock", () => {
  it("removes the lock file", () => {
    acquireLock(tmpDir);
    releaseLock(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, ".envault.lock"))).toBe(false);
  });

  it("does not throw when vault is not locked", () => {
    expect(() => releaseLock(tmpDir)).not.toThrow();
  });
});

describe("assertNotLocked", () => {
  it("does not throw when vault is not locked", () => {
    expect(() => assertNotLocked(tmpDir)).not.toThrow();
  });

  it("throws when vault is locked", () => {
    acquireLock(tmpDir);
    expect(() => assertNotLocked(tmpDir)).toThrow("Vault is locked");
  });
});
