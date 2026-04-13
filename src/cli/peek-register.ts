import { Command } from "commander";
import { registerPeekCommand } from "./peek";

/**
 * Registers the `peek` command and a `pv` alias (peek value) on the given program.
 */
export function registerPeekAlias(program: Command): void {
  registerPeekCommand(program);

  // Register `pv` as a short alias for `peek`
  program
    .command("pv <key>")
    .description("Alias for `peek` — preview a masked value")
    .option("-r, --reveal", "Show the full value unmasked", false)
    .option("-n, --chars <n>", "Number of visible trailing characters", "4")
    .action(async (key: string, options: { reveal: boolean; chars: string }) => {
      const peekCmd = program.commands.find((c) => c.name() === "peek");
      if (!peekCmd) {
        console.error("peek command not registered");
        process.exit(1);
      }
      await (peekCmd as any)._actionHandler([key, options]);
    });
}
