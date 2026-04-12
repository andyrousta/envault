import { Command } from "commander";
import { registerInfoCommand } from "./info";

/**
 * Registers the `info` command and a `status` alias on the given program.
 *
 * The `status` command is provided purely for discoverability — users familiar
 * with tools like `git status` or `docker status` can use it interchangeably
 * with `envault info`.
 */
export function registerInfoCommandAlias(program: Command): void {
  registerInfoCommand(program);

  // Also expose as `envault status` for discoverability
  program
    .command("status")
    .description("Alias for `envault info` — show vault metadata")
    .action(async () => {
      const infoCommand = program.commands.find((cmd) => cmd.name() === "info");
      if (!infoCommand) {
        console.error("Error: could not find the 'info' command to delegate to.");
        process.exit(1);
      }
      await infoCommand.parseAsync([], { from: "user" });
    });
}
