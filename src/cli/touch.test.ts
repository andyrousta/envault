import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerTouchCommand } from "./touch";

vi.mock("../vault/vaultFile", () => ({
  vaultExists: vi.fn(),
  readVault: vi.fn(),
  writeVault: vi.fn(),
}));

vi.mock("../crypto", () => ({
  decrypt: vi.fn(),
  encrypt: vi.fn(),
}));

vi.mock("./touch", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./touch")>();
  return { ...mod, prompt: vi.fn() };
});

import * as vaultFile from "../vault/vaultFile";
import * as crypto from "../crypto";
import * as touchModule from "./touch";

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTouchCommand(program);
  return program;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("touch command", () => {
  it("exits if vault does not exist", async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(false);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "test", "touch", "MY_KEY"])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits on wrong password", async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
    vi.mocked(vaultFile.readVault).mockReturnValue({ data: "enc", salt: "s", iv: "i" });
    vi.mocked(touchModule.prompt).mockResolvedValue("wrongpass");
    vi.mocked(crypto.decrypt).mockImplementation(() => { throw new Error("bad decrypt"); });
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "test", "touch", "MY_KEY"])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits if key not found", async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
    vi.mocked(vaultFile.readVault).mockReturnValue({ data: "enc", salt: "s", iv: "i" });
    vi.mocked(touchModule.prompt).mockResolvedValue("pass");
    vi.mocked(crypto.decrypt).mockReturnValue(JSON.stringify({ OTHER_KEY: { value: "x", updatedAt: "" } }));
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(program.parseAsync(["node", "test", "touch", "MY_KEY"])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("updates timestamp of existing key", async () => {
    vi.mocked(vaultFile.vaultExists).mockReturnValue(true);
    vi.mocked(vaultFile.readVault).mockReturnValue({ data: "enc", salt: "s", iv: "i" });
    vi.mocked(touchModule.prompt).mockResolvedValue("pass");
    const fakeEntries = { MY_KEY: { value: "hello", updatedAt: "2020-01-01" } };
    vi.mocked(crypto.decrypt).mockReturnValue(JSON.stringify(fakeEntries));
    vi.mocked(crypto.encrypt).mockReturnValue({ data: "newenc", salt: "s2", iv: "i2" });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(["node", "test", "touch", "MY_KEY"]);
    expect(vaultFile.writeVault).toHaveBeenCalledWith({ data: "newenc", salt: "s2", iv: "i2" }, undefined);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Touched \"MY_KEY\""));
  });
});
