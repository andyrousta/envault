import { Command } from "commander";
import { registerStatsCommand } from "./stats";
import * as vaultFile from "../vault/vaultFile";
import * as vault from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerStatsCommand(program);
  return program;
}

describe("stats command", () => {
  const mockEntries = {
    API_KEY: { value: "abc123", tags: ["production", "api"] },
    DB_URL: { value: "postgres://localhost", tags: ["production"] },
    DEBUG: { value: "true", tags: [] },
  };

  beforeEach(() => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    jest.spyOn(vault, "readVault").mockResolvedValue(mockEntries as any);
    jest.spyOn(require("fs"), "statSync").mockReturnValue({ size: 512 } as any);
    jest.spyOn(require("./stats"), "promptPassword").mockResolvedValue("password");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prints stats in plain text format", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "stats"]);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Total keys:   3");
    expect(output).toContain("Unique tags:  2");
    expect(output).toContain("#production: 2");
    expect(output).toContain("#api: 1");
    consoleSpy.mockRestore();
  });

  it("prints stats as JSON when --json flag is used", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "stats", "--json"]);
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.totalKeys).toBe(3);
    expect(parsed.uniqueTags).toBe(2);
    expect(parsed.tags.production).toBe(2);
    expect(parsed.fileSizeBytes).toBe(512);
    consoleSpy.mockRestore();
  });

  it("exits with error if vault does not exist", async () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(program.parseAsync(["node", "test", "stats"])).rejects.toThrow("exit");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("exits with error if password is wrong", async () => {
    jest.spyOn(vault, "readVault").mockRejectedValue(new Error("decrypt failed"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(program.parseAsync(["node", "test", "stats"])).rejects.toThrow("exit");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to read vault"));
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
