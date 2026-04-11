import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import { registerInfoCommand } from "./info";
import * as vaultFile from "../vault/vaultFile";

const mockStat = {
  size: 2048,
  mtime: new Date("2024-06-01T12:00:00Z"),
  birthtime: new Date("2024-01-15T08:30:00Z"),
};

const mockRaw = {
  entries: {
    API_KEY: { value: "enc", iv: "iv", tags: ["production"] },
    DB_URL: { value: "enc2", iv: "iv2", tags: ["production", "database"] },
    SECRET: { value: "enc3", iv: "iv3" },
  },
};

beforeEach(() => {
  vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
  vi.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test/.envault");
  vi.spyOn(vaultFile, "readVaultRaw").mockReturnValue(mockRaw as any);
  vi.spyOn(fs, "statSync").mockReturnValue(mockStat as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("info command", () => {
  it("prints vault metadata", async () => {
    const program = new Command();
    registerInfoCommand(program);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "envault", "info"]);

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("/tmp/test/.envault");
    expect(output).toContain("2.0 KB");
    expect(output).toContain("3");
    consoleSpy.mockRestore();
  });

  it("exits if vault does not exist", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const program = new Command();
    registerInfoCommand(program);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(program.parseAsync(["node", "envault", "info"])).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("counts unique tags correctly", async () => {
    const program = new Command();
    registerInfoCommand(program);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "envault", "info"]);

    const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    // production + database = 2 unique tags
    expect(output).toMatch(/2/);
    consoleSpy.mockRestore();
  });
});
