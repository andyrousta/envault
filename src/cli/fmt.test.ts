import { Command } from "commander";
import { registerFmtCommand } from "./fmt";
import * as vaultFile from "../vault/vaultFile";
import * as vaultEntry from "../vault/vaultEntry";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerFmtCommand(program);
  return program;
}

describe("fmt command", () => {
  const fakeEntries = [
    { key: "db_host", value: "localhost", tags: [] },
    { key: "api_key", value: "secret", tags: [] },
  ];

  beforeEach(() => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    jest.spyOn(vaultEntry, "readVault").mockReturnValue(fakeEntries as any);
    jest.spyOn(vaultEntry, "writeVault").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("formats keys to uppercase by default", async () => {
    const program = makeProgram();
    await program.parseAsync(["node", "test", "fmt", "-p", "pass"]);
    expect(vaultEntry.writeVault).toHaveBeenCalledWith(
      expect.any(String),
      "pass",
      expect.arrayContaining([
        expect.objectContaining({ key: "DB_HOST" }),
        expect.objectContaining({ key: "API_KEY" }),
      ])
    );
  });

  it("formats keys to lowercase with --style lower", async () => {
    jest.spyOn(vaultEntry, "readVault").mockReturnValue([
      { key: "DB_HOST", value: "localhost", tags: [] },
    ] as any);
    const program = makeProgram();
    await program.parseAsync(["node", "test", "fmt", "-p", "pass", "--style", "lower"]);
    expect(vaultEntry.writeVault).toHaveBeenCalledWith(
      expect.any(String),
      "pass",
      expect.arrayContaining([expect.objectContaining({ key: "db_host" })])
    );
  });

  it("does not write in dry-run mode", async () => {
    const program = makeProgram();
    await program.parseAsync(["node", "test", "fmt", "-p", "pass", "--dry-run"]);
    expect(vaultEntry.writeVault).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Dry run"));
  });

  it("exits if vault does not exist", async () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    const program = makeProgram();
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(
      program.parseAsync(["node", "test", "fmt", "-p", "pass"])
    ).rejects.toThrow("exit");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("reports no changes when all keys already match format", async () => {
    jest.spyOn(vaultEntry, "readVault").mockReturnValue([
      { key: "DB_HOST", value: "localhost", tags: [] },
    ] as any);
    const program = makeProgram();
    await program.parseAsync(["node", "test", "fmt", "-p", "pass", "--style", "upper"]);
    expect(vaultEntry.writeVault).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("already conform"));
  });
});
