import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import { registerShareCommand } from "./share";

vi.mock("../vault", () => ({
  readVault: vi.fn(),
}));

vi.mock("../crypto", () => ({
  deriveKey: vi.fn().mockResolvedValue("mockShareKey"),
  encrypt: vi.fn().mockResolvedValue("encryptedPayload"),
}));

vi.mock("fs");

const { readVault } = await import("../vault");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerShareCommand(program);
  return program;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("share command", () => {
  it("writes a share file for an existing key", async () => {
    vi.mocked(readVault).mockResolvedValue({
      API_KEY: { value: "secret123", tags: ["prod"] },
    } as any);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync([
      "node", "envault", "share", "API_KEY",
      "-p", "vaultpass",
      "-s", "sharepass",
      "-o", "out.env.share",
    ]);

    expect(fs.writeFileSync).toHaveBeenCalledOnce();
    const [filePath, content] = vi.mocked(fs.writeFileSync).mock.calls[0];
    expect(filePath).toContain("out.env.share");
    const parsed = JSON.parse(content as string);
    expect(parsed.version).toBe(1);
    expect(parsed.data).toBe("encryptedPayload");
  });

  it("exits when key is not found", async () => {
    vi.mocked(readVault).mockResolvedValue({} as any);
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "envault", "share", "MISSING", "-p", "pass", "-s", "sp"])
    ).rejects.toThrow();
  });
});
