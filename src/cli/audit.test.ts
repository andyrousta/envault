import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import * as vaultModule from "../vault";
import { auditCommand } from "./audit";

vi.mock("../vault");
vi.mock("./audit", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./audit")>();
  return {
    ...mod,
    promptPassword: vi.fn().mockResolvedValue("secret"),
  };
});

const tmpVaultPath = "/tmp/test-audit-vault.json";

describe("auditCommand", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
  });

  it("exits if vault does not exist", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(auditCommand(tmpVaultPath)).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits on wrong password", async () => {
    vi.mocked(vaultModule.readVault).mockRejectedValue(new Error("decrypt error"));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(auditCommand(tmpVaultPath)).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints audit report in text format", async () => {
    vi.mocked(vaultModule.readVault).mockResolvedValue({
      API_KEY: { value: "abc123", tags: ["prod"] },
      DB_PASS: { value: "secret", tags: [] },
      EMPTY_VAR: { value: "" },
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await auditCommand(tmpVaultPath);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Total keys      : 3");
    expect(output).toContain("Keys with tags  : 1");
    expect(output).toContain("Empty values    : 1");
  });

  it("detects duplicate values", async () => {
    vi.mocked(vaultModule.readVault).mockResolvedValue({
      KEY_A: { value: "same" },
      KEY_B: { value: "same" },
      KEY_C: { value: "unique" },
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await auditCommand(tmpVaultPath);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("KEY_A");
    expect(output).toContain("KEY_B");
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(vaultModule.readVault).mockResolvedValue({
      FOO: { value: "bar" },
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await auditCommand(tmpVaultPath, { json: true });
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.totalKeys).toBe(1);
    expect(parsed).toHaveProperty("keys");
  });
});
