import { Command } from "commander";
import { registerMvCommand } from "./mv";

/**
 * Registers `mv` and its alias `move` on the given program.
 */
export function registerMvAlias(program: Command): void {
  registerMvCommand(program);

  program
    .command("move <source> <destination>")
    .description("Alias for `mv` — move a vault entry to a new key")
    .option("-f, --force", "Overwrite destination if it already exists")
    .action(async (source: string, destination: string, opts: { force?: boolean }) => {
      // Delegate to the mv action by re-invoking through the registered mv command.
      const mvCmd = program.commands.find((c) => c.name() === "mv");
      if (!mvCmd) {
        console.error("mv command not found.");
        process.exit(1);
      }
      await mvCmd.parseAsync([source, destination, ...(opts.force ? ["--force"] : "")], {
        from: "user",
      });
    });
}
