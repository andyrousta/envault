import { describe, it, expect, vi, beforeEach } from "vitest";
import { lintEntries, LintIssue } from "./lint";
import { Command } from "commander";
import { registerLintCommand } from "./lint";
import * as vaultModule from "../vault";

describe("lintEntries", () => {
  it("returns no issues for valid entries", () => {
    const issues = lintEntries({ DATABASE_URL: "postgres://localhost/db", API_KEY: "supersecretvalue123" });
    expect(issues).toHaveLength(0);
  });

  it("flags keys that are not SCREAMING_SNAKE_CASE", () => {
    const issues = lintEntries({ "my-key": "value", dbUrl: "value2" });
    const errorKeys = issues.filter((i) => i.severity === "error").map((i) => i.key);
    expect(errorKeys).toContain("my-key");
    expect(errorKeys).toContain("dbUrl");
  });

  it("flags empty values as warnings", () => {
    const issues = lintEntries({ EMPTY_KEY: "" });
    const warn = issues.find((i) => i.key === "EMPTY_KEY" && i.severity === "warn");
    expect(warn).toBeDefined();
    expect(warn?.message).toMatch(/empty value/);
  });

  it("flags weak values as warnings", () => {
    const cases = ["password", "secret", "123456", "changeme", "ab"];
    for (const val of cases) {
      const issues = lintEntries({ SOME_KEY: val });
      const warn = issues.find((i) => i.severity === "warn");
      expect(warn).toBeDefined();
    }
  });

  it("can return multiple issues for the same key", () => {
    const issues = lintEntries({ "bad-key": "" });
    const keys = issues.map((i) => i.key);
    expect(keys.filter((k) => k === "bad-key").length).toBeGreaterThanOrEqual(2);
  });

  it("returns only errors for valid-named key with strong value", () => {
    const issues = lintEntries({ VALID_KEY: "str0ng-p@ssw0rd!" });
    expect(issues).toHaveLength(0);
  });
});

describe("registerLintCommand", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prints no issues message when vault is clean", async () => {
    vi.spyOn(vaultModule, "readVault").mockResolvedValue({
      entries: [{ key: "API_KEY", value: "supersecretvalue123", tags: [] }],
    } as any);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = new Command();
    registerLintCommand(program);
    await program.parseAsync(["node", "test", "lint", "--project", "test"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No issues found"));
  });

  it("prints issues when vault has problems", async () => {
    vi.spyOn(vaultModule, "readVault").mockResolvedValue({
      entries: [{ key: "bad-key", value: "", tags: [] }],
    } as any);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    const program = new Command();
    registerLintCommand(program);
    await program.parseAsync(["node", "test", "lint", "--project", "test"]);
    expect(consoleSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
