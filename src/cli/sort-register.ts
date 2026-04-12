import { Command } from "commander";
import { registerSortCommand } from "./sort";

/**
 * Registers the `sort` command and an `order` alias onto the given program.
 * The alias `order` behaves identically to `sort`.
 */
export function registerSortAlias(program: Command): void {
  registerSortCommand(program);

  // Register `order` as an alias for `sort`
  program
    .command("order")
    .description("Alias for `sort`: sort vault entries alphabetically by key")
    .option("--desc", "Sort in descending order")
    .option("--by-value", "Sort by value instead of key")
    .action(async (opts) => {
      // Delegate to the sort command by re-parsing with sort
      const args = ["node", "envault", "sort"];
      if (opts.desc) args.push("--desc");
      if (opts.byValue) args.push("--by-value");
      await program.parseAsync(args, { from: "user" });
    });
}
