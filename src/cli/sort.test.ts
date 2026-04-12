import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerSortCommand } from "./sort";
import * as vaultFile from "../vault";

vi.mock("../vault");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSortCommand(program);
  return program;
}

const mockVault = { ZEBRA: "last", ALPHA: "first", MANGO: "middle" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
  vi.mocked(vaultFile.readVault).mockResolvedValue({ ...mockVault });
  vi.mocked(vaultFile.writeVault).mockResolvedValue(undefined);
});

describe("sort command", () => {
  it("sorts entries ascending by key by default", async () => {
    const program = makeProgram();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "envault", "sort"], { from: "user" });
    const [written] = vi.mocked(vaultFile.writeVault).mock.calls[0];
    expect(Object.keys(written)).toEqual(["ALPHA", "MANGO", "ZEBRA"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("ascending"));
  });

  it("sorts entries descending by key with --desc", async () => {
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "sort", "--desc"], { from: "user" });
    const [written] = vi.mocked(vaultFile.writeVault).mock.calls[0];
    expect(Object.keys(written)).toEqual(["ZEBRA", "MANGO", "ALPHA"]);
  });

  it("sorts entries by value with --by-value", async () => {
    const program = makeProgram();
    await program.parseAsync(["node", "envault", "sort", "--by-value"], { from: "user" });
    const [written] = vi.mocked(vaultFile.writeVault).mock.calls[0];
    expect(Object.keys(written)).toEqual(["ALPHA", "MANGO", "ZEBRA"]);
  });

  it("exits if vault does not exist", async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(false);
    const program = makeProgram();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "envault", "sort"], { from: "user" })).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
  });

  it("exits on invalid password", async () => {
    vi.mocked(vaultFile.readVault).mockRejectedValue(new Error("bad password"));
    const program = makeProgram();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "envault", "sort"], { from: "user" })).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid password"));
  });
});
