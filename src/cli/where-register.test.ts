import { Command } from "commander";
import { registerWhereCommandAlias } from "./where-register";
import * as vaultFile from "../vault/vaultFile";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWhereCommandAlias(program);
  return program;
}

describe("where-register", () => {
  beforeEach(() => {
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue("/fake/vault.enc");
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers the 'where' command", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("where");
  });

  it("registers the 'path' alias command", () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("path");
  });

  it("'where' command runs without error", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    expect(() =>
      program.parse(["node", "envault", "where"])
    ).not.toThrow();
    spy.mockRestore();
  });

  it("'where --vault' outputs only vault path", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "where", "--vault"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("/fake/vault.enc");
    spy.mockRestore();
  });
});
