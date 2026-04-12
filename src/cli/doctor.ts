import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { vaultPath, vaultExists, readVaultRaw } from "../vault/vaultFile";
import { lockFilePath, isLocked } from "./lock";

interface CheckResult {
  label: string;
  status: "ok" | "warn" | "fail";
  message: string;
}

function check(label: string, status: "ok" | "warn" | "fail", message: string): CheckResult {
  return { label, status, message };
}

function printResult(result: CheckResult): void {
  const icon = result.status === "ok" ? "✔" : result.status === "warn" ? "⚠" : "✖";
  const color =
    result.status === "ok" ? "\x1b[32m" : result.status === "warn" ? "\x1b[33m" : "\x1b[31m";
  console.log(`${color}${icon}\x1b[0m  ${result.label}: ${result.message}`);
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Run diagnostics on the envault setup")
    .action(() => {
      const results: CheckResult[] = [];

      // Check vault file exists
      if (vaultExists()) {
        results.push(check("Vault file", "ok", `Found at ${vaultPath()}`));
      } else {
        results.push(check("Vault file", "fail", `No vault found at ${vaultPath()}. Run 'envault init'.`));
      }

      // Check vault file is readable and valid JSON
      if (vaultExists()) {
        try {
          const raw = readVaultRaw();
          JSON.parse(raw);
          results.push(check("Vault format", "ok", "Valid JSON structure"));
        } catch {
          results.push(check("Vault format", "fail", "Vault file is corrupted or not valid JSON"));
        }
      }

      // Check vault file permissions (warn if world-readable)
      if (vaultExists()) {
        try {
          const stat = fs.statSync(vaultPath());
          const mode = stat.mode & 0o777;
          if ((mode & 0o004) !== 0) {
            results.push(check("Vault permissions", "warn", `File is world-readable (mode ${mode.toString(8)}). Consider running: chmod 600 ${vaultPath()}`));
          } else {
            results.push(check("Vault permissions", "ok", `Mode ${mode.toString(8)}`));
          }
        } catch {
          results.push(check("Vault permissions", "warn", "Could not read file permissions"));
        }
      }

      // Check lock status
      if (isLocked()) {
        results.push(check("Lock status", "warn", `Vault is currently locked (${lockFilePath()})`));
      } else {
        results.push(check("Lock status", "ok", "No active lock"));
      }

      // Check Node.js version
      const [major] = process.versions.node.split(".").map(Number);
      if (major >= 18) {
        results.push(check("Node.js version", "ok", `v${process.versions.node}`));
      } else {
        results.push(check("Node.js version", "warn", `v${process.versions.node} detected; Node 18+ recommended`));
      }

      console.log("\nenvault doctor\n");
      results.forEach(printResult);

      const failures = results.filter((r) => r.status === "fail").length;
      const warnings = results.filter((r) => r.status === "warn").length;
      console.log(`\n${results.length} checks — ${failures} failed, ${warnings} warnings.`);

      if (failures > 0) process.exit(1);
    });
}
