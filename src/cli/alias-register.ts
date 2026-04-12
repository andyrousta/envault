import { Command } from "commander";
import { registerAliasCommand } from "./alias";

export function registerAliasCommandAlias(program: Command): void {
  registerAliasCommand(program);

  // Shorthand: `envault alias:set` top-level sugar via forwarding
  program
    .command("alias:set <alias> <key>")
    .description("Shorthand: create an alias for a vault key")
    .action((aliasName: string, key: string) => {
      program.parse(["node", "envault", "alias", "set", aliasName, key]);
    });

  program
    .command("alias:remove <alias>")
    .description("Shorthand: remove an alias")
    .action((aliasName: string) => {
      program.parse(["node", "envault", "alias", "remove", aliasName]);
    });
}
