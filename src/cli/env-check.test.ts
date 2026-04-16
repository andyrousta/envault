import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { checkEnvAgainstVault, registerEnvCheckCommand } from "./env-check";
import * as vault from "../vault";

vi.mock("../vault");

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerEnvCheckCommand(program);
  return program;
}

describe("checkEnvAgainstVault", () => {
  it("marks keys present in both vault and env", () => {
    const results = checkEnvAgainstVault({ DB_HOST: "localhost" }, { DB_HOST: "prod-host" });
    expect(results).toContainEqual({ key: "DB_HOST", presentInVault: true, presentInEnv: true });
  });

  it("marks keys missing from env", () => {
    const results = checkEnvAgainstVault({ API_KEY: "abc" }, {});
    expect(results).toContainEqual({ key: "API_KEY", presentInVault: true, presentInEnv: false });
  });

  it("treats empty string env value as missing", () => {
    const results = checkEnvAgainstVault({ TOKEN: "x" }, { TOKEN: "" });
    expect(results).toContainEqual({ key: "TOKEN", presentInVault: true, presentInEnv: false });
  });

  it("returns empty array for empty vault", () => {
    const results = checkEnvAgainstVault({}, { SOME_VAR: "val" });
    expect(results).toHaveLength(0);
  });
});

describe("env-check command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("prints all keys with their status", async () => {
    vi.mocked(vault.readVault).mockResolvedValue({ DB_HOST: "localhost", API_KEY: "key" });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    process.env.DB_HOST = "set-value";
    delete process.env.API_KEY;
    await program.parseAsync(["node", "test", "env-check", "--password", "secret"]);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("DB_HOST");
    expect(output).toContain("✔ set");
    expect(output).toContain("API_KEY");
    expect(output).toContain("✘ missing");
    consoleSpy.mockRestore();
    delete process.env.DB_HOST;
  });

  it("filters to only missing keys with --missing flag", async () => {
    vi.mocked(vault.readVault).mockResolvedValue({ DB_HOST: "localhost", API_KEY: "key" });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    process.env.DB_HOST = "set-value";
    delete process.env.API_KEY;
    await program.parseAsync(["node", "test", "env-check", "--password", "secret", "--missing"]);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).not.toContain("DB_HOST");
    expect(output).toContain("API_KEY");
    consoleSpy.mockRestore();
    delete process.env.DB_HOST;
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(vault.readVault).mockResolvedValue({ TOKEN: "abc" });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    delete process.env.TOKEN;
    await program.parseAsync(["node", "test", "env-check", "--password", "secret", "--json"]);
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed[0]).toHaveProperty("key", "TOKEN");
    expect(parsed[0]).toHaveProperty("presentInEnv", false);
    consoleSpy.mockRestore();
  });

  it("exits with error when vault cannot be read", async () => {
    vi.mocked(vault.readVault).mockRejectedValue(new Error("bad password"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "test", "env-check", "--password", "wrong"])
    ).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("could not read vault"));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
