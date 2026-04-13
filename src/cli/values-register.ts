import { Command } from "commander";
import { registerValuesCommand } from "./values";

/**
 * Registers the `values` command and its alias `vals` on the given program.
 */
export function registerValuesAlias(program: Command): void {
  registerValuesCommand(program);

  // Alias: `envault vals` as shorthand for `envault values`
  program
    .command("vals")
    .description("Alias for `values` — list all decrypted vault values")
    .option("-k, --key <key>", "Filter by a specific key")
    .option("--show-keys", "Show key names alongside values", false)
    .action(async (opts) => {
      // Delegate to the values command by re-parsing with the values sub-command
      const sub = new Command();
      sub.exitOverride();
      registerValuesCommand(sub);
      const args = ["node", "envault", "values"];
      if (opts.key) args.push("--key", opts.key);
      if (opts.showKeys) args.push("--show-keys");
      await sub.parseAsync(args);
    });
}
