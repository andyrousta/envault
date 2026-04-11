import { Command } from "commander";
import { registerInfoCommand } from "./info";

export function registerInfoCommandAlias(program: Command): void {
  registerInfoCommand(program);

  // Also expose as `envault status` for discoverability
  program
    .command("status")
    .description("Alias for `envault info` — show vault metadata")
    .action(async () => {
      const sub = new Command();
      registerInfoCommand(sub);
      await sub.parseAsync(["node", "envault", "info"]);
    });
}
