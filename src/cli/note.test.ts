import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerNoteCommand } from "./note";
import * as vaultModule from "../vault";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerNoteCommand(program);
  return program;
}

const mockVault = {
  entries: [
    { key: "API_KEY", value: "secret", tags: [] },
    { key: "DB_PASS", value: "hunter2", tags: [], note: "production db" },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(vaultModule, "readVault").mockResolvedValue(structuredClone(mockVault) as any);
  vi.spyOn(vaultModule, "writeVault").mockResolvedValue(undefined);
  vi.spyOn(vaultModule, "vaultPath").mockReturnValue("/tmp/test.vault");
});

describe("note set", () => {
  it("sets a note on an existing key", async () => {
    const { default: readline } = await import("readline");
    vi.spyOn(readline, "createInterface").mockReturnValueOnce({
      question: (_q: string, cb: (a: string) => void) => cb("pass"),
      close: vi.fn(),
    } as any).mockReturnValueOnce({
      question: (_q: string, cb: (a: string) => void) => cb("my note"),
      close: vi.fn(),
    } as any);
    const program = makeProgram();
    await program.parseAsync(["node", "test", "note", "set", "API_KEY", "--vault", "/tmp/test.vault"]);
    expect(vaultModule.writeVault).toHaveBeenCalled();
  });

  it("exits with error for missing key", async () => {
    const { default: readline } = await import("readline");
    vi.spyOn(readline, "createInterface").mockReturnValueOnce({
      question: (_q: string, cb: (a: string) => void) => cb("pass"),
      close: vi.fn(),
    } as any);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as any);
    await expect(
      program.parseAsync(["node", "test", "note", "set", "MISSING", "--vault", "/tmp/test.vault"])
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("note get", () => {
  it("prints the note for a key that has one", async () => {
    const { default: readline } = await import("readline");
    vi.spyOn(readline, "createInterface").mockReturnValueOnce({
      question: (_q: string, cb: (a: string) => void) => cb("pass"),
      close: vi.fn(),
    } as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "note", "get", "DB_PASS", "--vault", "/tmp/test.vault"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("production db"));
  });

  it("prints no-note message when note is absent", async () => {
    const { default: readline } = await import("readline");
    vi.spyOn(readline, "createInterface").mockReturnValueOnce({
      question: (_q: string, cb: (a: string) => void) => cb("pass"),
      close: vi.fn(),
    } as any);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "note", "get", "API_KEY", "--vault", "/tmp/test.vault"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No note"));
  });
});

describe("note clear", () => {
  it("removes the note from an entry", async () => {
    const { default: readline } = await import("readline");
    vi.spyOn(readline, "createInterface").mockReturnValueOnce({
      question: (_q: string, cb: (a: string) => void) => cb("pass"),
      close: vi.fn(),
    } as any);
    const program = makeProgram();
    await program.parseAsync(["node", "test", "note", "clear", "DB_PASS", "--vault", "/tmp/test.vault"]);
    expect(vaultModule.writeVault).toHaveBeenCalled();
  });
});
