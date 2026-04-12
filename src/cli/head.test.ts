import { Command } from "commander";
import { registerHeadCommand } from "./head";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";
import * as readline from "readline";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerHeadCommand(program);
  return program;
}

jest.mock("readline");

const mockRL = {
  question: jest.fn((_q: string, cb: (a: string) => void) => cb("secret")),
  close: jest.fn(),
};
(readline.createInterface as jest.Mock).mockReturnValue(mockRL);

jest.mock("../vault/vaultFile");
jest.mock("../vault/vaultEntry");

describe("head command", () => {
  const mockEntries = { ALPHA: "1", BETA: "2", GAMMA: "3", DELTA: "4", EPSILON: "5", ZETA: "6" };

  beforeEach(() => {
    jest.clearAllMocks();
    (vaultFile.vaultExists as jest.Mock).mockReturnValue(true);
    (vaultEntry.readVault as jest.Mock).mockResolvedValue(mockEntries);
  });

  it("shows first 5 entries by default", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "test", "head", "--project", "default"]);
    const output = spy.mock.calls.flat().join("\n");
    expect(output).toContain("ALPHA=1");
    expect(output).toContain("EPSILON=5");
    expect(output).not.toContain("ZETA=6");
    spy.mockRestore();
  });

  it("respects --lines option", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await makeProgram().parseAsync(["node", "test", "head", "-n", "2", "--project", "default"]);
    const output = spy.mock.calls.flat().join("\n");
    expect(output).toContain("ALPHA=1");
    expect(output).toContain("BETA=2");
    expect(output).not.toContain("GAMMA=3");
    spy.mockRestore();
  });

  it("exits if vault does not exist", async () => {
    (vaultFile.vaultExists as jest.Mock).mockReturnValue(false);
    const spy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(makeProgram().parseAsync(["node", "test", "head", "--project", "missing"])).rejects.toThrow();
    expect(spy).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });

  it("exits on wrong password", async () => {
    (vaultEntry.readVault as jest.Mock).mockRejectedValue(new Error("bad decrypt"));
    const spy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(makeProgram().parseAsync(["node", "test", "head", "--project", "default"])).rejects.toThrow();
    expect(spy).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });
});
