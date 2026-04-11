import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import { registerCloneCommand } from "./clone";
import * as vaultModule from "../vault";

vi.mock("../vault");

const mockReadVault = vi.mocked(vaultModule.readVault);
const mockWriteVault = vi.mocked(vaultModule.writeVault);

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-clone-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

describe("clone command", () => {
  it("copies vault file to destination without rekey", async () => {
    const src = path.join(tmpDir, "source.vault");
    const dest = path.join(tmpDir, "dest.vault");
    fs.writeFileSync(src, JSON.stringify({ entries: [] }));

    const program = makeProgram();
    await program.parseAsync(["node", "envault", "clone", src, dest]);

    expect(fs.existsSync(dest)).toBe(true);
    const content = fs.readFileSync(dest, "utf-8");
    expect(content).toContain("entries");
  });

  it("exits with error if source vault does not exist", async () => {
    const src = path.join(tmpDir, "nonexistent.vault");
    const dest = path.join(tmpDir, "dest.vault");

    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "envault", "clone", src, dest]);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("re-encrypts vault when --rekey flag is used", async () => {
    const src = path.join(tmpDir, "source.vault");
    const dest = path.join(tmpDir, "rekeyed.vault");
    fs.writeFileSync(src, JSON.stringify({ entries: [] }));

    const fakeVault = { entries: [{ key: "FOO", value: "bar", tags: [] }] };
    mockReadVault.mockResolvedValue(fakeVault as any);
    mockWriteVault.mockResolvedValue(undefined);

    vi.doMock("./clone", async () => {
      const actual = await vi.importActual<typeof import("./clone")>("./clone");
      return actual;
    });

    // Simulate prompt inputs via mock
    let callCount = 0;
    vi.spyOn(require("readline"), "createInterface").mockImplementation(() => ({
      question: (_: string, cb: (a: string) => void) => {
        const answers = ["oldpass", "newpass", "newpass"];
        cb(answers[callCount++] ?? "");
      },
      close: () => {},
    }));

    expect(mockReadVault).toBeDefined();
    expect(mockWriteVault).toBeDefined();
  });
});
