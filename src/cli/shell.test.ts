import { describe, it, expect, vi, beforeEach } from "vitest";
import { shellCommand } from "./shell";
import * as vaultModule from "../vault";
import * as cryptoModule from "../crypto";

vi.mock("readline", () => ({
  default: {
    createInterface: () => ({
      question: (_: string, cb: (a: string) => void) => cb("testpassword"),
      close: vi.fn(),
    }),
  },
}));

vi.mock("../vault", () => ({
  vaultExists: vi.fn(),
  readVault: vi.fn(),
}));

vi.mock("child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0, error: null })),
}));

const mockVaultExists = vi.mocked(vaultModule.vaultExists);
const mockReadVault = vi.mocked(vaultModule.readVault);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("shellCommand", () => {
  it("exits with error if vault does not exist", async () => {
    mockVaultExists.mockReturnValue(false);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(shellCommand("/fake/dir")).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error if decryption fails", async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockRejectedValue(new Error("bad password"));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(shellCommand("/fake/dir")).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("spawns shell with vault env vars injected", async () => {
    mockVaultExists.mockReturnValue(true);
    mockReadVault.mockResolvedValue({ API_KEY: "secret123", DB_URL: "postgres://localhost" });
    const { spawnSync } = await import("child_process");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(shellCommand("/fake/dir", "/bin/bash")).rejects.toThrow("exit");
    expect(spawnSync).toHaveBeenCalledWith(
      "/bin/bash",
      expect.objectContaining({
        env: expect.objectContaining({ API_KEY: "secret123", DB_URL: "postgres://localhost" }),
        stdio: "inherit",
      })
    );
  });
});
