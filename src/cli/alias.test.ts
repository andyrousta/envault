import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Command } from "commander";
import * as fs from "fs";
import {
  readAliases,
  writeAliases,
  registerAliasCommand,
  aliasFilePath,
} from "./alias";

vi.mock("fs");

const mockAliases = { mydb: "DATABASE_URL", myapi: "API_KEY" };

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerAliasCommand(program);
  return program;
}

describe("readAliases", () => {
  it("returns empty object when file does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(readAliases()).toEqual({});
  });

  it("returns parsed aliases when file exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockAliases));
    expect(readAliases()).toEqual(mockAliases);
  });

  it("returns empty object on parse error", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("invalid json");
    expect(readAliases()).toEqual({});
  });
});

describe("writeAliases", () => {
  it("writes aliases as JSON", () => {
    writeAliases(mockAliases);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      aliasFilePath,
      JSON.stringify(mockAliases, null, 2),
      "utf-8"
    );
  });
});

describe("alias set", () => {
  it("saves a new alias", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "test", "alias", "set", "mydb", "DATABASE_URL"]);
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("mydb"));
    consoleSpy.mockRestore();
  });
});

describe("alias remove", () => {
  it("exits with error if alias not found", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() =>
      makeProgram().parse(["node", "test", "alias", "remove", "ghost"])
    ).toThrow();
    exitSpy.mockRestore();
  });
});

describe("alias list", () => {
  it("prints no aliases when empty", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "test", "alias", "list"]);
    expect(consoleSpy).toHaveBeenCalledWith("No aliases defined.");
    consoleSpy.mockRestore();
  });

  it("lists aliases", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockAliases));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "test", "alias", "list"]);
    expect(consoleSpy).toHaveBeenCalledWith("mydb -> DATABASE_URL");
    consoleSpy.mockRestore();
  });
});
