import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Command } from "commander";
import { readProfile, writeProfile, registerWhoamiCommand, type Profile } from "./whoami";

const testProfilePath = path.join(os.tmpdir(), ".envault-test-profile.json");

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof fs>("fs");
  return { ...actual };
});

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWhoamiCommand(program);
  return program;
}

describe("readProfile / writeProfile", () => {
  beforeEach(() => {
    if (fs.existsSync(testProfilePath)) fs.unlinkSync(testProfilePath);
  });

  afterEach(() => {
    if (fs.existsSync(testProfilePath)) fs.unlinkSync(testProfilePath);
  });

  it("returns null when no profile file exists", () => {
    vi.spyOn(fs, "existsSync").mockReturnValueOnce(false);
    expect(readProfile()).toBeNull();
  });

  it("writes and reads back a profile", () => {
    const profile: Profile = { name: "Alice", email: "alice@example.com", createdAt: "2024-01-01T00:00:00.000Z" };
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(profile));
    expect(readProfile()).toEqual(profile);
  });

  it("returns null on malformed JSON", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("not-json");
    expect(readProfile()).toBeNull();
  });
});

describe("whoami show", () => {
  it("prints no-profile message when profile is missing", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "whoami", "show"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No profile set"));
    spy.mockRestore();
  });
});

describe("whoami set", () => {
  it("writes profile and logs confirmation", () => {
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "whoami", "set", "--name", "Bob"]);
    expect(writeSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Bob"));
    writeSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe("whoami clear", () => {
  it("removes profile file if it exists", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const unlinkSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "whoami", "clear"]);
    expect(unlinkSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("Profile cleared.");
    unlinkSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("prints message when no profile to clear", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    makeProgram().parse(["node", "envault", "whoami", "clear"]);
    expect(logSpy).toHaveBeenCalledWith("No profile to clear.");
    logSpy.mockRestore();
  });
});
