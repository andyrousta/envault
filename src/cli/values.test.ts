import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerValuesCommand } from "./values";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerValuesCommand(program);
  return program;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("values command", () => {
  it("exits if vault does not exist", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "envault", "values"])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("lists all values without keys", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({ FOO: "bar", BAZ: "qux" } as any);
    const { promptPassword } = await import("./values");
    vi.spyOn(await import("./values"), "promptPassword").mockResolvedValue("secret");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "values"]);
    expect(logSpy).toHaveBeenCalledWith("bar");
    expect(logSpy).toHaveBeenCalledWith("qux");
  });

  it("lists values with keys when --show-keys is passed", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({ API_KEY: "abc123" } as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "values", "--show-keys"]);
    expect(logSpy).toHaveBeenCalledWith("API_KEY=abc123");
  });

  it("filters by key when --key is provided", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({ FOO: "bar", BAZ: "qux" } as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "values", "--key", "FOO"]);
    expect(logSpy).toHaveBeenCalledWith("bar");
    expect(logSpy).not.toHaveBeenCalledWith("qux");
  });

  it("exits if filtered key is not found", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({ FOO: "bar" } as any);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "envault", "values", "--key", "MISSING"])
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints empty message if vault has no entries", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({} as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "values"]);
    expect(logSpy).toHaveBeenCalledWith("Vault is empty.");
  });
});
