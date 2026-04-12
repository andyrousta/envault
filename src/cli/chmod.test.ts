import fs from "fs";
import path from "path";
import os from "os";
import { Command } from "commander";
import { modePath, readMode, writeMode, registerChmodCommand } from "./chmod";
import { writeVault } from "../vault/vaultFile";
import { deriveKey, encrypt } from "../crypto/vault";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-chmod-"));
}

async function seedVault(dir: string, password: string): Promise<void> {
  const key = await deriveKey(password, dir);
  await writeVault(dir, key, []);
}

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerChmodCommand(p);
  return p;
}

describe("readMode / writeMode", () => {
  let dir: string;
  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("returns 'owner' when no mode file exists", () => {
    expect(readMode(dir)).toBe("owner");
  });

  it("writes and reads back a mode", () => {
    writeMode("readonly", dir);
    expect(readMode(dir)).toBe("readonly");
  });

  it("falls back to 'owner' for unknown mode value", () => {
    fs.writeFileSync(modePath(dir), "superadmin", "utf-8");
    expect(readMode(dir)).toBe("owner");
  });
});

describe("chmod:get command", () => {
  let dir: string;
  beforeEach(async () => {
    dir = makeTmpDir();
    await seedVault(dir, "pass");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("prints current mode", async () => {
    writeMode("shared", dir);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const p = makeProgram();
    await p.parseAsync(["node", "test", "chmod:get", "--dir", dir]);
    expect(spy).toHaveBeenCalledWith("Current vault mode: shared");
    spy.mockRestore();
  });

  it("exits when no vault exists", async () => {
    const empty = makeTmpDir();
    const p = makeProgram();
    await expect(p.parseAsync(["node", "test", "chmod:get", "--dir", empty])).rejects.toThrow();
    fs.rmSync(empty, { recursive: true, force: true });
  });
});

describe("chmod command", () => {
  let dir: string;
  beforeEach(async () => {
    dir = makeTmpDir();
    await seedVault(dir, "secret");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("rejects invalid mode", async () => {
    const p = makeProgram();
    await expect(p.parseAsync(["node", "test", "chmod", "admin", "--dir", dir])).rejects.toThrow();
  });
});
