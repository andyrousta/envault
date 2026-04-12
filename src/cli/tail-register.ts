import { Command } from "commander";
import { registerTailCommand } from "./tail";

/**
 * Registers `tail` as a top-level command and also exposes it
 * under the alias `last` for discoverability.
 */
export function registerTailCommandAlias(program: Command): void {
  registerTailCommand(program);

  // Alias: `envault last` → same behaviour as `envault tail`
  program
    .command("last")
    .description("Alias for \"tail\" — show the last N vault entries")
    .option("-n, --lines <number>", "Number of entries to show", "10")
    .option("-t, --tag <tag>", "Filter entries by tag")
    .option("-p, --password <password>", "Vault password")
    .action(async (opts) => {
      // Delegate to the real tail command by re-parsing with the tail sub-command
      const sub = new Command();
      sub.exitOverride();
      registerTailCommand(sub);
      const args = ["node", "envault", "tail"];
      if (opts.lines)    args.push("-n", opts.lines);
      if (opts.tag)      args.push("--tag", opts.tag);
      if (opts.password) args.push("-p", opts.password);
      await sub.parseAsync(args);
    });
}
