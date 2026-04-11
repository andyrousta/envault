import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import { registerReceiveCommand } from "./receive";

vi.mock("../vault", () => ({
  readVault: vi.fn(),
  writeVaultEntry: vi.fn(),
}));

vi.mock("../crypto", () => ({
  deriveKey: vi.fn().mockResolvedValue("mockShareKey"),
  decrypt: vi.fn().mockResolvedValue(
    JSON.stringify({ key: "API_KEY", value: "secret123", tags: ["prod"] })
  ),
}));

vi.mock("fs");

const { readVault, writeVaultEntry } = await import("../vault");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerReceiveCommand(program);
  return program;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("receive command", () => {
  it("imports a secret from a valid share file", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ version: 1, data: "encryptedPayload" })
    );
    vi.mocked(readVault).mockResolvedValue({} as any);
    vi.mocked(writeVaultEntry).mockResolvedValue(undefined);

    const program = makeProgram();
    await program.parseAsync([
      "node", "envault", "receive", "test.env.share",
      "-p", "vaultpass",
      "-s", "sharepass",
      "--overwrite",
    ]);

    expect(writeVaultEntry).toHaveBeenCalledWith("vaultpass", "API_KEY", "secret123", ["prod"]);
  });

  it("exits when share file does not exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "envault", "receive", "missing.env.share", "-p", "p", "-s", "s"])
    ).rejects.toThrow();
  });

  it("rejects invalid share file format", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: 99 }));
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "envault", "receive", "bad.env.share", "-p", "p", "-s", "s"])
    ).rejects.toThrow();
  });
});
