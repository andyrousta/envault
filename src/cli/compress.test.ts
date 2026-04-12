import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import * as fs from "fs";
import * as zlib from "zlib";
import * as vaultFile from "../vault/vaultFile";
import { registerCompressCommand } from "./compress";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCompressCommand(program);
  return program;
}

describe("compress command", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exits if vault does not exist", async () => {
    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(false);
    vi.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    const program = makeProgram();
    await expect(program.parseAsync(["compress"], { from: "user" })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("compresses the vault file", async () => {
    const fakeContent = Buffer.from(JSON.stringify({ entries: [] }));
    const fakeCompressed = zlib.gzipSync(fakeContent);

    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    vi.spyOn(fs, "readFileSync").mockReturnValue(fakeContent);
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(zlib, "gzipSync").mockReturnValue(fakeCompressed);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["compress"], { from: "user" });

    expect(writeSpy).toHaveBeenCalledWith("/tmp/test.vault.gz", fakeCompressed);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("compressed"));
  });

  it("decompresses a compressed vault file", async () => {
    const fakeContent = Buffer.from(JSON.stringify({ entries: [] }));
    const fakeCompressed = zlib.gzipSync(fakeContent);

    vi.spyOn(vaultFile, "vaultExists").mockReturnValue(true);
    vi.spyOn(vaultFile, "vaultPath").mockReturnValue("/tmp/test.vault");
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(fakeCompressed);
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(zlib, "gunzipSync").mockReturnValue(fakeContent);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["compress", "--decompress"], { from: "user" });

    expect(writeSpy).toHaveBeenCalledWith("/tmp/test.vault", fakeContent);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("decompressed"));
  });
});
