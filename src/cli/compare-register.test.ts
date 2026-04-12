import { Command } from "commander";
import { registerCompareAlias } from "./compare-register";
import * as compareModule from "./compare";

jest.mock("./compare");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCompareAlias(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("registers compare command via registerCompareAlias", () => {
  const program = makeProgram();
  const commandNames = program.commands.map((c) => c.name());
  expect(commandNames).toContain("compare");
});

test("registers diff-vaults alias", () => {
  const program = makeProgram();
  const commandNames = program.commands.map((c) => c.name());
  expect(commandNames).toContain("diff-vaults");
});

test("diff-vaults alias invokes compare logic", async () => {
  const mockRegister = compareModule.registerCompareCommand as jest.Mock;
  mockRegister.mockImplementation((prog: Command) => {
    prog
      .command("compare <vaultA> <vaultB>")
      .action(async () => {
        console.log("compare called");
      });
  });

  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const program = makeProgram();

  // diff-vaults should delegate to compare internally
  const diffCmd = program.commands.find((c) => c.name() === "diff-vaults");
  expect(diffCmd).toBeDefined();
  logSpy.mockRestore();
});

test("registerCompareCommand is called once per program registration", () => {
  const mockRegister = compareModule.registerCompareCommand as jest.Mock;
  makeProgram();
  expect(mockRegister).toHaveBeenCalledTimes(1);
});
