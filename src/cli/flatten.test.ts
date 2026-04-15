import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerFlattenCommand } from "./flatten";
import * as vaultFile from "../vault/vaultFile";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerFlattenCommand(program);
  return program;
}

vi.mock("readline", () => ({
  createInterface: () => ({
    question: (_: string, cb: (a: string) => void) => cb("secret"),
    close: vi.fn(),
  }),
}));

describe("flatten command", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("removes tags from all entries", async () => {
    const mockVault = {
      API_KEY: { value: "abc", tags: ["prod", "api"] },
      DB_URL: { value: "postgres://", tags: ["db"] },
    };
    vi.spyOn(vaultFile, "readVault").mockResolvedValue(mockVault as any);
    const writeSpy = vi.spyOn(vaultFile, "writeVault").mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(["node", "test", "flatten"]);

    expect(writeSpy).toHaveBeenCalledOnce();
    const written = writeSpy.mock.calls[0][0] as any;
    expect(written.API_KEY.tags).toEqual([]);
    expect(written.DB_URL.tags).toEqual([]);
    expect(logSpy).toHaveBeenCalledWith("Removed tags from 2 entry/entries.");
  });

  it("reports 0 changes when no tags exist", async () => {
    const mockVault = {
      API_KEY: { value: "abc", tags: [] },
    };
    vi.spyOn(vaultFile, "readVault").mockResolvedValue(mockVault as any);
    const writeSpy = vi.spyOn(vaultFile, "writeVault").mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(["node", "test", "flatten"]);

    expect(writeSpy).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith("Removed tags from 0 entry/entries.");
  });

  it("dry-run does not write vault", async () => {
    const mockVault = {
      TOKEN: { value: "xyz", tags: ["ci"] },
    };
    vi.spyOn(vaultFile, "readVault").mockResolvedValue(mockVault as any);
    const writeSpy = vi.spyOn(vaultFile, "writeVault").mockResolvedValue(undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(["node", "test", "flatten", "--dry-run"]);

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("exits on bad password", async () => {
    vi.spyOn(vaultFile, "readVault").mockRejectedValue(new Error("bad password"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    const program = makeProgram();
    await expect(program.parseAsync(["node", "test", "flatten"])).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
