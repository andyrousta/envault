import { describe, it, expect, vi, beforeEach } from "vitest";
import { envCommand } from "./env";
import * as vaultModule from "../vault";

vi.mock("../vault");
vi.mock("./get", () => ({
  promptPassword: vi.fn().mockResolvedValue("secret"),
}));

const mockEntries = {
  API_KEY: "abc123",
  DB_URL: "postgres://localhost/mydb",
  SECRET: "it's a secret",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(vaultModule, "readVault").mockResolvedValue(mockEntries);
});

describe("envCommand", () => {
  it("prints export statements when no args provided", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await envCommand("/tmp/vault.env", []);

    expect(logs).toContain("export API_KEY='abc123'");
    expect(logs).toContain("export DB_URL='postgres://localhost/mydb'");
    // single quotes in value should be escaped
    expect(logs).toContain("export SECRET='it'\\''s a secret'");
  });

  it("calls readVault with correct path and password", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await envCommand("/my/vault", []);
    expect(vaultModule.readVault).toHaveBeenCalledWith("/my/vault", "secret");
  });

  it("exits with error when decryption fails", async () => {
    vi.spyOn(vaultModule, "readVault").mockRejectedValue(new Error("bad decrypt"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(envCommand("/tmp/vault.env", [])).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith("Failed to decrypt vault. Wrong password?");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
