import { Command } from "commander";
import * as fs from "fs";
import * as vaultFile from "../vault/vaultFile";
import { registerWatchCommand } from "./watch";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchCommand(program);
  return program;
}

describe("watch command", () => {
  let mockWatch: jest.SpyInstance;
  let mockVaultExists: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    mockVaultExists = jest.spyOn(vaultFile, "vaultExists");
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockExit = jest.spyOn(process, "exit").mockImplementation((() => {}) as never);
    mockWatch = jest.spyOn(fs, "watch").mockReturnValue({
      on: jest.fn(),
      close: jest.fn(),
    } as unknown as fs.FSWatcher);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exits with error if vault does not exist", () => {
    mockVaultExists.mockReturnValue(false);
    const program = makeProgram();
    program.parse(["node", "envault", "watch"]);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("starts watching if vault exists", () => {
    mockVaultExists.mockReturnValue(true);
    const program = makeProgram();
    program.parse(["node", "envault", "watch"]);
    expect(mockWatch).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Watching vault"));
  });

  it("uses custom debounce value", () => {
    mockVaultExists.mockReturnValue(true);
    const program = makeProgram();
    program.parse(["node", "envault", "watch", "--debounce", "500"]);
    expect(mockWatch).toHaveBeenCalled();
  });

  it("uses custom directory option", () => {
    mockVaultExists.mockReturnValue(true);
    const vaultPathSpy = jest.spyOn(vaultFile, "vaultPath");
    const program = makeProgram();
    program.parse(["node", "envault", "watch", "--dir", "/tmp/myproject"]);
    expect(vaultPathSpy).toHaveBeenCalledWith(expect.stringContaining("myproject"));
  });
});
