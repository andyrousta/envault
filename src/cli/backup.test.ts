import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import * as vaultFile from "../vault/vaultFile";
import * as backup from "./backup";

vi.mock("../vault/vaultFile");

const mockVaultExists = vi.mocked(vaultFile.vaultExists);
const mockReadVaultRaw = vi.mocked(vaultFile.readVaultRaw);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("backupCommand", () => {
  it("exits if vault does not exist", async () => {
    mockVaultExists.mockReturnValue(false);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(backup.backupCommand(undefined, { yes: true })).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("writes backup file to specified directory", async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVaultRaw.mockReturnValue('{"entries":[]}');

    const writeFileSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await backup.backupCommand("/tmp", { yes: true });

    expect(writeFileSpy).toHaveBeenCalledOnce();
    const [writtenPath, content] = writeFileSpy.mock.calls[0];
    expect(String(writtenPath)).toContain("envault-backup-");
    expect(String(writtenPath)).toContain(".vault");
    expect(content).toBe('{"entries":[]}');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Vault backed up to:"));
  });

  it("cancels backup when user declines confirmation", async () => {
    mockVaultExists.mockReturnValue(true);
    vi.spyOn(backup, "promptPassword").mockResolvedValue("n");
    const writeFileSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await backup.backupCommand(undefined, {});

    expect(writeFileSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Backup cancelled.");
  });

  it("proceeds when user confirms with 'y'", async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVaultRaw.mockReturnValue('{"entries":[]}');
    vi.spyOn(backup, "promptPassword").mockResolvedValue("y");
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const writeFileSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    await backup.backupCommand(undefined, {});

    expect(writeFileSpy).toHaveBeenCalledOnce();
  });
});
