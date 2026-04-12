import { Command } from "commander";
import { registerCompareCommand } from "./compare";
import * as vaultModule from "../vault";
import * as fs from "fs";

jest.mock("../vault");
jest.mock("fs");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCompareCommand(program);
  return program;
}

const mockEntriesA = [
  { key: "DB_HOST", value: "localhost" },
  { key: "DB_PORT", value: "5432" },
  { key: "ONLY_A", value: "secret" },
];

const mockEntriesB = [
  { key: "DB_HOST", value: "remotehost" },
  { key: "DB_PORT", value: "5432" },
  { key: "ONLY_B", value: "other" },
];

beforeEach(() => {
  jest.clearAllMocks();
  (fs.existsSync as jest.Mock).mockReturnValue(true);
  jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
});

test("shows keys only in A, only in B, and changed keys", async () => {
  (vaultModule.readVault as jest.Mock)
    .mockReturnValueOnce(mockEntriesA)
    .mockReturnValueOnce(mockEntriesB);

  const { promptPassword } = jest.requireActual("./compare");
  jest
    .spyOn(require("./compare"), "promptPassword")
    .mockResolvedValueOnce("passA")
    .mockResolvedValueOnce("passB");

  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(["node", "test", "compare", "vaultA.env", "vaultB.env"]);

  const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
  expect(output).toContain("only in A");
  expect(output).toContain("only in B");
  expect(output).toContain("changed");
  logSpy.mockRestore();
});

test("reports identical vaults", async () => {
  const sameEntries = [{ key: "FOO", value: "bar" }];
  (vaultModule.readVault as jest.Mock)
    .mockReturnValueOnce(sameEntries)
    .mockReturnValueOnce(sameEntries);

  jest
    .spyOn(require("./compare"), "promptPassword")
    .mockResolvedValueOnce("pass")
    .mockResolvedValueOnce("pass");

  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(["node", "test", "compare", "vaultA.env", "vaultB.env"]);

  expect(logSpy).toHaveBeenCalledWith("Vaults are identical.");
  logSpy.mockRestore();
});

test("exits if vault file does not exist", async () => {
  (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
  const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(["node", "test", "compare", "missing.env", "vaultB.env"]);
  expect(process.exit).toHaveBeenCalledWith(1);
  errSpy.mockRestore();
});
