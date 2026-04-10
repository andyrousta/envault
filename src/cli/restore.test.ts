import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import * as vaultModule from "../vault";
import * as cryptoModule from "../crypto";

vi.mock("fs");
vi.mock("../vault");
vi.mock("../crypto");
vi.mock("readline", () => ({
  default: {
    createInterface: vi.fn().mockReturnValue({
      question: vi.fn((_q: string, cb: (a: string) => void) => cb("secret")),
      close: vi.fn(),
    }),
  },
}));

const MOCK_ENTRIES = { API_KEY: "value1", DB_URL: "value2" };
const MOCK_BACKUP = JSON.stringify({ iv: "mockiv", data: "encrypteddata" });

describe("restoreCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exits with error if no backup path provided", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const { restoreCommand } = await import("./restore");
    await expect(restoreCommand("", { password: "secret" })).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error if backup file does not exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const { restoreCommand } = await import("./restore");
    await expect(restoreCommand("/fake/path.bak", { password: "secret" })).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error if backup file is invalid JSON", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("not-json");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const { restoreCommand } = await import("./restore");
    await expect(restoreCommand("/fake/path.bak", { password: "secret" })).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error if decryption fails", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(MOCK_BACKUP);
    vi.mocked(cryptoModule.decrypt).mockRejectedValue(new Error("bad decrypt"));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const { restoreCommand } = await import("./restore");
    await expect(restoreCommand("/fake/path.bak", { password: "wrong" })).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("restores vault successfully when no existing vault", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(MOCK_BACKUP);
    vi.mocked(cryptoModule.decrypt).mockResolvedValue(JSON.stringify(MOCK_ENTRIES));
    vi.mocked(vaultModule.vaultExists).mockReturnValue(false);
    vi.mocked(vaultModule.writeVault).mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { restoreCommand } = await import("./restore");
    await restoreCommand("/fake/path.bak", { password: "secret", force: false });
    expect(vaultModule.writeVault).toHaveBeenCalledWith(MOCK_ENTRIES);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("restored"));
  });

  it("overwrites existing vault when force is true", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(MOCK_BACKUP);
    vi.mocked(cryptoModule.decrypt).mockResolvedValue(JSON.stringify(MOCK_ENTRIES));
    vi.mocked(vaultModule.vaultExists).mockReturnValue(true);
    vi.mocked(vaultModule.writeVault).mockResolvedValue(undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { restoreCommand } = await import("./restore");
    await restoreCommand("/fake/path.bak", { password: "secret", force: true });
    expect(vaultModule.writeVault).toHaveBeenCalledWith(MOCK_ENTRIES);
  });
});
