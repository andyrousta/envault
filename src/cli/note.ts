import fs from "fs";
import path from "path";
import readline from "readline";
import { vaultPath, readVault, writeVault } from "../vault";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerNoteCommand(program: import("commander").Command) {
  const note = program.command("note").description("Attach or view notes on vault entries");

  note
    .command("set <key>")
    .description("Set a note on a vault entry")
    .option("--vault <path>", "Path to vault file")
    .action(async (key: string, opts: { vault?: string }) => {
      const vaultFile = opts.vault ?? vaultPath();
      const password = await prompt("Password: ");
      const vault = await readVault(vaultFile, password);
      const entry = vault.entries.find((e) => e.key === key);
      if (!entry) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }
      const noteText = await prompt(`Note for "${key}": `);
      entry.note = noteText.trim() || undefined;
      await writeVault(vaultFile, password, vault);
      console.log(`Note ${entry.note ? "set" : "cleared"} for "${key}".`);
    });

  note
    .command("get <key>")
    .description("View the note on a vault entry")
    .option("--vault <path>", "Path to vault file")
    .action(async (key: string, opts: { vault?: string }) => {
      const vaultFile = opts.vault ?? vaultPath();
      const password = await prompt("Password: ");
      const vault = await readVault(vaultFile, password);
      const entry = vault.entries.find((e) => e.key === key);
      if (!entry) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }
      if (entry.note) {
        console.log(`Note for "${key}": ${entry.note}`);
      } else {
        console.log(`No note set for "${key}".`);
      }
    });

  note
    .command("clear <key>")
    .description("Remove the note from a vault entry")
    .option("--vault <path>", "Path to vault file")
    .action(async (key: string, opts: { vault?: string }) => {
      const vaultFile = opts.vault ?? vaultPath();
      const password = await prompt("Password: ");
      const vault = await readVault(vaultFile, password);
      const entry = vault.entries.find((e) => e.key === key);
      if (!entry) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }
      delete entry.note;
      await writeVault(vaultFile, password, vault);
      console.log(`Note cleared for "${key}".`);
    });
}
