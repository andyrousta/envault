import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerMvAlias } from "./mv-register";
import { registerMvCommand } from "./mv";
import * as vaultFile from "../vault/vaultFile";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerMvCommand(program);
  registerMvAlias(program);
  return program;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
});

describe("mv-register", () => {
  it("registers a 'move' alias command", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("mv");
    expect(names).toContain("move");
  });

  it("'move' command has --force option", () => {
    const program = makeProgram();
    const moveCmd = program.commands.find((c) => c.name() === "move")!;
    const optNames = moveCmd.options.map((o) => o.long);
    expect(optNames).toContain("--force");
  });

  it("'mv' command has --force option", () => {
    const program = makeProgram();
    const mvCmd = program.commands.find((c) => c.name() === "mv")!;
    const optNames = mvCmd.options.map((o) => o.long);
    expect(optNames).toContain("--force");
  });
});
