import type { Command } from "commander";
import { registerNoteCommand } from "./note";

export function registerNoteCommandAlias(program: Command): void {
  registerNoteCommand(program);

  // Convenience alias: `envault note` top-level sugar already registered;
  // expose `envault annotate` as an alias for `envault note set`
  program
    .command("annotate <key> <text>")
    .description("Shorthand to set a note on a vault entry (alias for 'note set')")
    .option("--vault <path>", "Path to vault file")
    .action(async (key: string, text: string, opts: { vault?: string }) => {
      const { vaultPath, readVault, writeVault } = await import("../vault");
      const readline = (await import("readline")).default;
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const password: string = await new Promise((resolve) =>
        rl.question("Password: ", (ans) => { rl.close(); resolve(ans); })
      );
      const vaultFile = opts.vault ?? vaultPath();
      const vault = await readVault(vaultFile, password);
      const entry = vault.entries.find((e: any) => e.key === key);
      if (!entry) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }
      entry.note = text.trim() || undefined;
      await writeVault(vaultFile, password, vault);
      console.log(`Annotation ${entry.note ? "set" : "cleared"} for "${key}".`);
    });
}
