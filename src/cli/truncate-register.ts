import { Command } from "commander";
import { registerTruncateCommand } from "./truncate";

/**
 * Registers the `truncate` command and a `clear` alias on the given program.
 */
export function registerTruncateAlias(program: Command): void {
  registerTruncateCommand(program);

  // Alias: `envault clear` maps to the same behaviour
  const alias = new Command("clear")
    .description("Alias for 'truncate' — remove all entries from the vault")
    .option("-f, --force", "Skip confirmation prompt")
    .option("--vault <path>", "Path to vault file")
    .action(async (opts) => {
      // Delegate to the truncate sub-command by re-parsing with the truncate name
      const sub = program.commands.find((c) => c.name() === "truncate");
      if (!sub) {
        console.error("truncate command not registered");
        process.exit(1);
      }
      await sub.parseAsync(
        [
          ...(opts.force ? ["--force"] : []),
          ...(opts.vault ? ["--vault", opts.vault] : []),
        ],
        { from: "user" }
      );
    });

  program.addCommand(alias);
}
