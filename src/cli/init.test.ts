import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { initVault } from "./init";
import { vaultExists, readVaultRaw } from "../vault/vaultFile";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-init-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("initVault", () => {
  it("creates a vault file in the target directory", async () => {
    // Mock readline prompt
    jest.spyOn(require("readline"), "createInterface").mockReturnValue({
      question: (_q: string, cb: (a: string) => void) => cb("testpassword123"),
      close: jest.fn(),
    } as any);

    await initVault(tmpDir);

    expect(vaultExists(tmpDir)).toBe(true);
  });

  it("vault file contains version, salt, and empty entries", async () => {
    jest.spyOn(require("readline"), "createInterface").mockReturnValue({
      question: (_q: string, cb: (a: string) => void) => cb("securepass"),
      close: jest.fn(),
    } as any);

    await initVault(tmpDir);

    const raw = readVaultRaw(tmpDir);
    const parsed = JSON.parse(raw);

    expect(parsed.version).toBe(1);
    expect(typeof parsed.salt).toBe("string");
    expect(parsed.salt.length).toBeGreaterThan(0);
    expect(parsed.entries).toEqual({});
  });

  it("exits with error if vault already exists", async () => {
    jest.spyOn(require("readline"), "createInterface").mockReturnValue({
      question: (_q: string, cb: (a: string) => void) => cb("pass"),
      close: jest.fn(),
    } as any);

    await initVault(tmpDir);

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(initVault(tmpDir)).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
