import { Command } from "commander";
import { registerRenameCommandAlias } from "./rename-register";
import * as renameModule from "./rename";

describe("registerRenameCommandAlias", () => {
  function makeProgram() {
    const program = new Command();
    program.exitOverride();
    registerRenameCommandAlias(program);
    return program;
  }

  it("registers the mv alias command", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("mv");
  });

  it("mv command has correct description", () => {
    const program = makeProgram();
    const mv = program.commands.find((c) => c.name() === "mv");
    expect(mv).toBeDefined();
    expect(mv!.description()).toMatch(/rename/i);
  });

  it("mv command accepts --path option", () => {
    const program = makeProgram();
    const mv = program.commands.find((c) => c.name() === "mv");
    expect(mv).toBeDefined();
    const pathOpt = mv!.options.find((o) => o.long === "--path");
    expect(pathOpt).toBeDefined();
  });

  it("delegates to rename module action", async () => {
    const spy = jest.spyOn(renameModule, "registerRenameCommand").mockImplementation(() => {});
    const program = makeProgram();
    const mv = program.commands.find((c) => c.name() === "mv");
    expect(mv).toBeDefined();
    // Trigger the action
    try {
      await program.parseAsync(["node", "envault", "mv", "OLD_KEY", "NEW_KEY"], { from: "user" });
    } catch (_) {
      // may throw due to mock
    }
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
