import { Command } from "commander";
import { registerClearCommand } from "./clear";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";
import * as readline from "readline";

jest.mock("../vault/vaultFile");
jest.mock("../vault/vaultEntry");

const mockedVaultExists = vaultFile.vaultExists as jest.Mock;
const mockedReadVault = vaultFile.readVault as jest.Mock;
const mockedWriteVault = vaultFile.writeVault as jest.Mock;

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerClearCommand(program);
  return program;
}

function mockPrompt(responses: string[]) {
  let idx = 0;
  jest.spyOn(readline, "createInterface").mockImplementation(() => ({
    question: (_q: string, cb: (ans: string) => void) => cb(responses[idx++] ?? ""),
    close: jest.fn(),
  } as any));
}

beforeEach(() => jest.clearAllMocks());

test("exits if vault does not exist", async () => {
  mockedVaultExists.mockReturnValue(false);
  const program = makeProgram();
  const exit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
  await expect(program.parseAsync(["node", "envault", "clear", "--force"])).rejects.toThrow();
  expect(exit).toHaveBeenCalledWith(1);
});

test("aborts if confirmation is not 'yes'", async () => {
  mockedVaultExists.mockReturnValue(true);
  mockPrompt(["no", "password"]);
  const program = makeProgram();
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  await program.parseAsync(["node", "envault", "clear"]);
  expect(log).toHaveBeenCalledWith("Aborted.");
  expect(mockedReadVault).not.toHaveBeenCalled();
});

test("clears all entries with --force and correct password", async () => {
  mockedVaultExists.mockReturnValue(true);
  mockedReadVault.mockResolvedValue({ entries: { FOO: { value: "bar" }, BAZ: { value: "qux" } } });
  mockedWriteVault.mockResolvedValue(undefined);
  mockPrompt(["masterpass"]);
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  const program = makeProgram();
  await program.parseAsync(["node", "envault", "clear", "--force"]);
  expect(mockedWriteVault).toHaveBeenCalledWith(
    expect.objectContaining({ entries: {} }),
    "masterpass",
    undefined
  );
  expect(log).toHaveBeenCalledWith("Cleared 2 entries from the vault.");
});

test("exits on wrong password", async () => {
  mockedVaultExists.mockReturnValue(true);
  mockedReadVault.mockRejectedValue(new Error("decrypt failed"));
  mockPrompt(["wrongpass"]);
  const exit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
  jest.spyOn(console, "error").mockImplementation(() => {});
  const program = makeProgram();
  await expect(program.parseAsync(["node", "envault", "clear", "--force"])).rejects.toThrow();
  expect(exit).toHaveBeenCalledWith(1);
});
