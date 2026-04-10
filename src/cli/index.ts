import { Command } from "commander";
import { initCommand } from "./init";
import { setCommand } from "./set";
import { getCommand } from "./get";
import { listCommand } from "./list";
import { deleteCommand } from "./delete";
import { exportCommand } from "./export";
import { importCommand } from "./import";
import { copyCommand } from "./copy";
import { rotateCommand } from "./rotate";
import { renameCommand } from "./rename";
import { searchCommand } from "./search";
import { tagCommand } from "./tag";
import { diffCommand } from "./diff";
import { auditCommand } from "./audit";
import { vaultPath } from "../vault";

export function buildCli(): Command {
  const program = new Command();
  program.name("envault").description("Encrypted local environment variable vault").version("1.0.0");

  program.command("init").description("Initialize a new vault").action(() => initCommand(vaultPath()));
  program.command("set <key>").description("Set a vault entry").action((key) => setCommand(vaultPath(), key));
  program.command("get <key>").description("Get a vault entry").action((key) => getCommand(vaultPath(), key));
  program.command("list").description("List all vault keys").action(() => listCommand(vaultPath()));
  program.command("delete <key>").description("Delete a vault entry").action((key) => deleteCommand(vaultPath(), key));
  program.command("export").description("Export vault to .env format").action(() => exportCommand(vaultPath()));
  program.command("import <file>").description("Import from a .env file").action((file) => importCommand(vaultPath(), file));
  program.command("copy <src> <dest>").description("Copy an entry to a new key").action((src, dest) => copyCommand(vaultPath(), src, dest));
  program.command("rotate").description("Re-encrypt vault with a new password").action(() => rotateCommand(vaultPath()));
  program.command("rename <oldKey> <newKey>").description("Rename a vault key").action((o, n) => renameCommand(vaultPath(), o, n));
  program.command("search <term>").description("Search vault keys").action((term) => searchCommand(vaultPath(), term));
  program.command("tag <key>").description("Add or remove tags on a key").action((key) => tagCommand(vaultPath(), key));
  program.command("diff <otherVault>").description("Diff two vaults").action((other) => diffCommand(vaultPath(), other));
  program
    .command("audit")
    .description("Audit vault for issues (empty values, duplicates, untagged keys)")
    .option("--json", "Output report as JSON")
    .action((opts) => auditCommand(vaultPath(), { json: opts.json }));

  return program;
}
