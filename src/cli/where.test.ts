import { Command } from "commander";
import { registerWhereCommand } from "./where";
import * as vaultFile from "../vault/vaultFile";
import * as os from "os";
import * as path from "path";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWhereCommand(program);
  return program;
}

describe("where command", () => {
  const fakeVaultPath = "/tmp/.envault/vault.enc";
  const fakeConfigDir = path.join(os.homedir(), ".envault");

  beforeEach(() => {
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue(fakeVaultPath);
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prints human-readable output by default", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "where"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(fakeVaultPath));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(fakeConfigDir));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("yes"));
    spy.mockRestore();
  });

  it("prints only vault path with --vault", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "where", "--vault"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(fakeVaultPath);
    spy.mockRestore();
  });

  it("prints only config dir with --config", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "where", "--config"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(fakeConfigDir);
    spy.mockRestore();
  });

  it("outputs valid JSON with --json", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "where", "--json"]);
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.vault).toBe(fakeVaultPath);
    expect(parsed.config).toBe(fakeConfigDir);
    expect(parsed.vaultExists).toBe(true);
    spy.mockRestore();
  });

  it("shows vault exists as no when vault is missing", () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "where"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("no"));
    spy.mockRestore();
  });
});
