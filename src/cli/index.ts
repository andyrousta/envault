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

export function buildCli(): Command {
  const program = new Command();

  program.name("envault").description("Securely store and sync environment variables").version("1.0.0");

  program.command("init").description("Initialize a new vault").action(initCommand);
  program.command("set <key> <value>").description("Set a variable").action(setCommand);
  program.command("get <key>").description("Get a variable").action(getCommand);
  program.command("list").description("List all variables").action(listCommand);
  program.command("delete <key>").description("Delete a variable").action(deleteCommand);
  program.command("export").description("Export vault to .env format").action(exportCommand);
  program.command("import <file>").description("Import from a .env file").action(importCommand);
  program.command("copy <key>").description("Copy a value to clipboard").action(copyCommand);
  program.command("rotate").description("Rotate the master password").action(rotateCommand);
  program.command("rename <oldKey> <newKey>").description("Rename a key").action(renameCommand);
  program.command("search <term>").description("Search keys and values").action(searchCommand);
  program.command("tag <key> [tags...]").description("Tag a key").action(tagCommand);
  program
    .command("diff <otherVaultPath>")
    .description("Diff local vault against another vault file")
    .action(diffCommand);

  return program;
}
