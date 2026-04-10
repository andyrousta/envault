import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { searchCommand, promptPassword } from "./search";
import { initVault } from "../vault/vaultEntry";
import { setEntry } from "../vault/vaultEntry";

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "envault-search-"));

describe("searchCommand", () => {
  let vaultDir: string;
  const password = "test-password";

  beforeEach(async () => {
    vaultDir = tmpDir();
    await initVault(vaultDir, password);
    await setEntry(vaultDir, password, "DATABASE_URL", "postgres://localhost");
    await setEntry(vaultDir, password, "DATABASE_HOST", "localhost");
    await setEntry(vaultDir, password, "API_KEY", "secret");
    await setEntry(vaultDir, password, "API_SECRET", "topsecret");
  });

  afterEach(() => {
    fs.rmSync(vaultDir, { recursive: true, force: true });
  });

  it("prints matching keys for a given pattern", async () => {
    vi.spyOn(require("./search"), "promptPassword").mockResolvedValue(password);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await searchCommand("DATABASE", vaultDir);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("DATABASE_URL");
    expect(output).toContain("DATABASE_HOST");
    expect(output).not.toContain("API_KEY");

    consoleSpy.mockRestore();
  });

  it("prints no results message when pattern has no matches", async () => {
    vi.spyOn(require("./search"), "promptPassword").mockResolvedValue(password);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await searchCommand("NONEXISTENT", vaultDir);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No keys matching"));
    consoleSpy.mockRestore();
  });

  it("exits with error when no pattern is provided", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(searchCommand(undefined, vaultDir)).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("search pattern"));

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("exits with error when vault does not exist", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(searchCommand("API", "/nonexistent/path")).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
