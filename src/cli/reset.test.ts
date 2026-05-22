import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerResetCommand } from "./reset";
import { writeVault } from "../vault/vaultFile";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerResetCommand(program);
  return program;
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-reset-"));
}

describe("reset command", () => {
  it("exits cleanly when no vault exists", async () => {
    const dir = makeTmpDir();
    const program = makeProgram();
    const spy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(
      program.parseAsync(["node", "test", "reset", "--force", "--dir", dir])
    ).resolves.not.toThrow();
    spy.mockRestore();
    fs.rmdirSync(dir, { recursive: true } as any);
  });

  it("removes vault file with --force", async () => {
    const dir = makeTmpDir();
    const vaultFile = path.join(dir, ".envault");
    writeVault(dir, { entries: [] });
    expect(fs.existsSync(vaultFile)).toBe(true);

    const program = makeProgram();
    await program.parseAsync(["node", "test", "reset", "--force", "--dir", dir]);

    expect(fs.existsSync(vaultFile)).toBe(false);
    fs.rmdirSync(dir, { recursive: true } as any);
  });

  it("removes related files with --force", async () => {
    const dir = makeTmpDir();
    writeVault(dir, { entries: [] });
    const lockFile = path.join(dir, ".envault.lock");
    fs.writeFileSync(lockFile, "");

    const program = makeProgram();
    await program.parseAsync(["node", "test", "reset", "--force", "--dir", dir]);

    expect(fs.existsSync(lockFile)).toBe(false);
    fs.rmdirSync(dir, { recursive: true } as any);
  });

  it("cancels reset when user does not confirm", async () => {
    const dir = makeTmpDir();
    writeVault(dir, { entries: [] });
    const vaultFile = path.join(dir, ".envault");

    const { default: rl } = await import("readline");
    jest.spyOn(rl, "createInterface").mockReturnValue({
      question: (_q: string, cb: (ans: string) => void) => cb("no"),
      close: jest.fn(),
    } as any);

    const program = makeProgram();
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(
      program.parseAsync(["node", "test", "reset", "--dir", dir])
    ).rejects.toThrow("exit");

    expect(fs.existsSync(vaultFile)).toBe(true);
    exitSpy.mockRestore();
    jest.restoreAllMocks();
    fs.rmdirSync(dir, { recursive: true } as any);
  });
});
