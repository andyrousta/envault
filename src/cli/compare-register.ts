import { Command } from "commander";
import { registerCompareCommand } from "./compare";

export function registerCompareAlias(program: Command): void {
  registerCompareCommand(program);

  // Alias: `envault diff-vaults` maps to compare for discoverability
  program
    .command("diff-vaults <vaultA> <vaultB>")
    .description("Alias for 'compare': compare two vault files")
    .option("--only-keys", "Only show key names, not values")
    .action(async (vaultA: string, vaultB: string, opts: { onlyKeys?: boolean }) => {
      const sub = new Command();
      sub.exitOverride();
      registerCompareCommand(sub);
      const args = ["node", "test", "compare", vaultA, vaultB];
      if (opts.onlyKeys) args.push("--only-keys");
      await sub.parseAsync(args);
    });
}
