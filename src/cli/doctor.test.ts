import { Command } from "commander";
import * as vaultFile from "../vault/vaultFile";
import * as lock from "./lock";
import { registerDoctorCommand } from "./doctor";

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDoctorCommand(program);
  return program;
}

describe("doctor command", () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports ok when vault exists, is valid JSON, and is not locked", () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    jest.spyOn(vaultFile, "readVaultRaw").mockReturnValue(JSON.stringify({ entries: [] }));
    jest.spyOn(lock, "isLocked").mockReturnValue(false);
    jest.spyOn(lock, "lockFilePath").mockReturnValue("/tmp/test.lock");
    const fs = require("fs");
    jest.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100600 });

    makeProgram().parse(["node", "envault", "doctor"]);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Vault file");
    expect(output).toContain("Vault format");
    expect(output).toContain("Lock status");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits with code 1 when vault does not exist", () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/missing.vault");
    jest.spyOn(lock, "isLocked").mockReturnValue(false);
    jest.spyOn(lock, "lockFilePath").mockReturnValue("/tmp/test.lock");

    makeProgram().parse(["node", "envault", "doctor"]);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("warns when vault is locked", () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    jest.spyOn(vaultFile, "readVaultRaw").mockReturnValue(JSON.stringify({ entries: [] }));
    jest.spyOn(lock, "isLocked").mockReturnValue(true);
    jest.spyOn(lock, "lockFilePath").mockReturnValue("/tmp/test.lock");
    const fs = require("fs");
    jest.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100600 });

    makeProgram().parse(["node", "envault", "doctor"]);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Vault is currently locked");
  });

  it("warns when vault file is world-readable", () => {
    jest.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    jest.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    jest.spyOn(vaultFile, "readVaultRaw").mockReturnValue(JSON.stringify({ entries: [] }));
    jest.spyOn(lock, "isLocked").mockReturnValue(false);
    jest.spyOn(lock, "lockFilePath").mockReturnValue("/tmp/test.lock");
    const fs = require("fs");
    jest.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100644 });

    makeProgram().parse(["node", "envault", "doctor"]);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("world-readable");
  });
});
