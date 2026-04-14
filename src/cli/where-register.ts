import { Command } from "commander";
import { registerWhereCommand } from "./where";

/**
 * Registers the `where` command and its alias `path` on the given program.
 */
export function registerWhereCommandAlias(program: Command): void {
  registerWhereCommand(program);

  // alias: `envault path` → same behaviour
  const alias = new Command("path")
    .description("Alias for 'where' — show vault and config paths")
    .option("--vault", "Print only the vault file path")
    .option("--config", "Print only the config directory path")
    .option("--json", "Output as JSON")
    .action(function () {
      // Delegate by re-parsing through the where sub-command
      const whereCmd = program.commands.find((c) => c.name() === "where");
      if (whereCmd) {
        whereCmd.setOptionValueWithSource(
          "vault",
          this.opts().vault,
          "cli"
        );
        whereCmd.setOptionValueWithSource(
          "config",
          this.opts().config,
          "cli"
        );
        whereCmd.setOptionValueWithSource(
          "json",
          this.opts().json,
          "cli"
        );
        whereCmd.emit("command:where");
        whereCmd._actionHandler(whereCmd.opts());
      }
    });

  program.addCommand(alias);
}
