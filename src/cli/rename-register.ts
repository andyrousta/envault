import { Command } from "commander";
import { registerRenameCommand } from "./rename";

export function registerRenameCommandAlias(program: Command): void {
  const mv = program
    .command("mv <oldKey> <newKey>")
    .description("Alias for rename — rename a vault entry key")
    .option("-p, --path <path>", "path to vault file")
    .action(async (oldKey: string, newKey: string, opts: { path?: string }) => {
      // Delegate to the rename command logic by re-using its action
      const sub = new Command();
      registerRenameCommand(sub);
      await sub.parseAsync(
        ["node", "envault", "rename", oldKey, newKey, ...(opts.path ? ["--path", opts.path] : "")],
        { from: "user" }
      );
    });

  void mv;
}
