import fs from "fs";
import path from "path";
import { Command } from "commander";
import { readVault } from "../vault";

const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const WEAK_VALUE_PATTERNS = [
  /^(password|secret|123456|changeme|test|example)$/i,
  /^.{1,3}$/,
];

export interface LintIssue {
  key: string;
  severity: "error" | "warn";
  message: string;
}

export function lintEntries(
  entries: Record<string, string>
): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const [key, value] of Object.entries(entries)) {
    if (!ENV_KEY_PATTERN.test(key)) {
      issues.push({
        key,
        severity: "error",
        message: `Key "${key}" does not follow SCREAMING_SNAKE_CASE convention`,
      });
    }

    if (value.trim() === "") {
      issues.push({
        key,
        severity: "warn",
        message: `Key "${key}" has an empty value`,
      });
    }

    for (const pattern of WEAK_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        issues.push({
          key,
          severity: "warn",
          message: `Key "${key}" appears to have a weak or placeholder value`,
        });
        break;
      }
    }
  }

  return issues;
}

export function registerLintCommand(program: Command): void {
  program
    .command("lint")
    .description("Check vault entries for naming and value issues")
    .option("-p, --project <name>", "project name", path.basename(process.cwd()))
    .action(async (opts) => {
      const vault = await readVault(opts.project);
      const plain: Record<string, string> = {};

      for (const entry of vault.entries) {
        plain[entry.key] = entry.value;
      }

      const issues = lintEntries(plain);

      if (issues.length === 0) {
        console.log("✅ No issues found.");
        return;
      }

      for (const issue of issues) {
        const icon = issue.severity === "error" ? "❌" : "⚠️ ";
        console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
      }

      const errors = issues.filter((i) => i.severity === "error").length;
      if (errors > 0) process.exit(1);
    });
}
