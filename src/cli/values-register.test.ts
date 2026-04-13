import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerValuesAlias } from "./values-register";
import * as vaultFile from "../vault/vaultFile";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerValuesAlias(program);
  return program;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("values-register alias", () => {
  it("registers both 'values' and 'vals' commands", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("values");
    expect(names).toContain("vals");
  });

  it("vals alias exits if vault does not exist", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "envault", "vals"])
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("vals alias lists values with show-keys option", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({ TOKEN: "xyz" } as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "vals", "--show-keys"]);
    expect(logSpy).toHaveBeenCalledWith("TOKEN=xyz");
  });

  it("vals alias filters by key", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "readVault").mockReturnValue({ A: "1", B: "2" } as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "vals", "--key", "A"]);
    expect(logSpy).toHaveBeenCalledWith("1");
    expect(logSpy).not.toHaveBeenCalledWith("2");
  });
});
