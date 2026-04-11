import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerMergeCommand } from "./merge";
import * as vaultModule from "../vault";
import * as cryptoModule from "../crypto";
import * as fs from "fs";

vi.mock("../vault");
vi.mock("../crypto");
vi.mock("fs");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerMergeCommand(program);
  return program;
}

const mockPrompt = vi.fn();
vi.mock("readline", () => ({
  createInterface: () => ({
    question: (_: string, cb: (a: string) => void) => cb(mockPrompt()),
    close: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("merge command", () => {
  it("exits if source vault file does not exist", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "test", "merge", "./missing.vault"])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits if local vault does not exist", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(false);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "test", "merge", "./source.vault"])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("merges new keys without overwriting existing ones by default", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    mockPrompt.mockReturnValueOnce("targetpass").mockReturnValueOnce("sourcepass");
    vi.spyOn(vaultModule, "readVault").mockResolvedValue({ EXISTING_KEY: "old_value" });
    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ data: "enc", iv: "iv", salt: "salt" }));
    vi.spyOn(cryptoModule, "decrypt").mockResolvedValue(JSON.stringify({ EXISTING_KEY: "new_value", NEW_KEY: "hello" }));
    const writeSpy = vi.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "merge", "./source.vault"]);
    expect(writeSpy).toHaveBeenCalledWith({ EXISTING_KEY: "old_value", NEW_KEY: "hello" }, "targetpass");
    expect(consoleSpy).toHaveBeenCalledWith("Merge complete: 1 added, 0 overwritten, 1 skipped.");
  });

  it("overwrites existing keys when --overwrite flag is set", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(vaultModule, "vaultExists").mockReturnValue(true);
    mockPrompt.mockReturnValueOnce("targetpass").mockReturnValueOnce("sourcepass");
    vi.spyOn(vaultModule, "readVault").mockResolvedValue({ EXISTING_KEY: "old_value" });
    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ data: "enc", iv: "iv", salt: "salt" }));
    vi.spyOn(cryptoModule, "decrypt").mockResolvedValue(JSON.stringify({ EXISTING_KEY: "new_value" }));
    const writeSpy = vi.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "merge", "./source.vault", "--overwrite"]);
    expect(writeSpy).toHaveBeenCalledWith({ EXISTING_KEY: "new_value" }, "targetpass");
    expect(consoleSpy).toHaveBeenCalledWith("Merge complete: 0 added, 1 overwritten, 0 skipped.");
  });
});
