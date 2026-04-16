import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { readVault } from "../vault";

export interface EnvCheckResult {
  key: string;
  presentInVault: boolean;
  presentInEnv: boolean;
}

export function checkEnvAgainstVault(
  vaultEntries: Record<string, string>,
  env: Record<string, string | undefined>
): EnvCheckResult[] {
  const allKeys = new Set([
    ...Object.keys(vaultEntries),
    ...Object.keys(env).filter((k) => Object.keys(vaultEntries).includes(k)),
  ]);

  return Array.from(allKeys).map((key) => ({
    key,
    presentInVault: key in vaultEntries,
    presentInEnv: key in env && env[key] !== undefined && env[key] !== "",
  }));
}

export function registerEnvCheckCommand(program: Command): void {
  program
    .command("env-check")
    .description("Check which vault keys are missing from the current environment")
    .option("-p, --password <password>", "vault password")
    .option("--missing", "show only missing keys", false)
    .option("--json", "output as JSON", false)
    .action(async (opts) => {
      const password = opts.password ?? process.env.ENVAULT_PASSWORD ?? "";
      if (!password) {
        console.error("Error: password is required");
        process.exit(1);
      }

      let entries: Record<string, string>;
      try {
        entries = await readVault(password);
      } catch {
        console.error("Error: could not read vault. Wrong password or no vault found.");
        process.exit(1);
      }

      const results = checkEnvAgainstVault(entries, process.env as Record<string, string | undefined>);
      const filtered = opts.missing ? results.filter((r) => !r.presentInEnv) : results;

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
      }

      if (filtered.length === 0) {
        console.log("All vault keys are present in the environment.");
        return;
      }

      for (const r of filtered) {
        const envStatus = r.presentInEnv ? "✔ set" : "✘ missing";
        console.log(`${r.key.padEnd(30)} ${envStatus}`);
      }
    });
}
