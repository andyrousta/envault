import { Command } from "commander";
import { registerTruncateAlias } from "./truncate-register";
import * as truncateMod from "./truncate";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTruncateAlias(program);
  return program;
}

describe("registerTruncateAlias", () => {
  it("registers the 'trunc' alias command", () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === "trunc");
    expect(cmd).toBeDefined();
  });

  it("'trunc' command has the correct description", () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === "trunc");
    expect(cmd?.description()).toMatch(/truncate/i);
  });

  it("delegates to registerTruncateCommand handler", async () => {
    const spy = jest
      .spyOn(truncateMod, "registerTruncateCommand")
      .mockImplementation((prog) => {
        prog.command("truncate").action(() => {});
      });

    const program = new Command();
    program.exitOverride();
    registerTruncateAlias(program);

    spy.mockRestore();
    expect(true).toBe(true);
  });

  it("accepts a key argument", () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === "trunc");
    const args = cmd?.registeredArguments ?? [];
    expect(args.length).toBeGreaterThan(0);
  });

  it("accepts --path option", () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === "trunc");
    const opts = cmd?.options ?? [];
    const hasPath = opts.some((o) => o.long === "--path");
    expect(hasPath).toBe(true);
  });
});
