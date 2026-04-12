import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerMvCommand } from "./mv";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerMvCommand(program);
  return program;
}

const mockVault = { entries: [{ key: "OLD_KEY", value: "secret", tags: ["prod"], note: "my note" }] };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
  vi.spyOn(vaultFile, "readVault").mockResolvedValue(structuredClone(mockVault) as any);
  vi.spyOn(vaultFile, "writeVault").mockResolvedValue(undefined);
  vi.spyOn(vaultEntry, "getEntry").mockImplementation((v: any, key: string) =>
    v.entries.find((e: any) => e.key === key) ?? null
  );
  vi.spyOn(vaultEntry, "setEntry").mockImplementation((v: any, key: string, value: string, meta: any) => ({
    ...v,
    entries: [...v.entries, { key, value, ...meta }],
  }));
  vi.spyOn(vaultEntry, "deleteEntry").mockImplementation((v: any, key: string) => ({
    ...v,
    entries: v.entries.filter((e: any) => e.key !== key),
  }));
});

describe("mv command", () => {
  it("moves an existing entry to a new key", async () => {
    const program = makeProgram();
    const { prompt } = await import("./mv");
    vi.spyOn({ prompt }, "prompt").mockResolvedValue("pass");
    // Patch prompt via module mock
    vi.doMock("./mv", async (orig: any) => ({ ...(await orig()), prompt: async () => "pass" }));

    // Directly test the logic by calling writeVault expectations
    await program.parseAsync(["node", "test", "mv", "OLD_KEY", "NEW_KEY"], { from: "user" }).catch(() => {});
    // writeVault should have been called
    expect(vaultFile.writeVault).toHaveBeenCalled();
  });

  it("exits if vault does not exist", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "test", "mv", "A", "B"], { from: "user" })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits if source key not found", async () => {
    vi.spyOn(vaultEntry, "getEntry").mockReturnValue(null as any);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(program.parseAsync(["node", "test", "mv", "MISSING", "DEST"], { from: "user" })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits if destination exists and --force not set", async () => {
    vi.spyOn(vaultEntry, "getEntry").mockReturnValue({ key: "X", value: "v", tags: [], note: "" } as any);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(program.parseAsync(["node", "test", "mv", "OLD_KEY", "NEW_KEY"], { from: "user" })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
