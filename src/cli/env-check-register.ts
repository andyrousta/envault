import { Command } from "commander";
import { registerEnvCheckCommand } from "./env-check";

/**
 * Registers `env-check` under the alias `ec` for convenience.
 *
 * Example:
 *   envault ec --missing --password secret
 */
export function registerEnvCheckAlias(program: Command): void {
  const alias = new Command("ec")
    .description("Alias for env-check: check vault keys against current environment")
    .option("-p, --password <password>", "vault password")
    .option("--missing", "show only missing keys", false)
    .option("--json", "output as JSON", false)
    .action(async (opts) => {
      // Delegate to the canonical env-check command by re-parsing through a
      // temporary sub-program so we reuse all logic without duplication.
      const sub = new Command();
      sub.exitOverride();
      registerEnvCheckCommand(sub);
      const args = ["node", "test", "env-check"];
      if (opts.password) args.push("--password", opts.password);
      if (opts.missing) args.push("--missing");
      if (opts.json) args.push("--json");
      await sub.parseAsync(args);
    });

  program.addCommand(alias);
}
