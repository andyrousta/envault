import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const aliasFilePath = path.join(os.homedir(), ".envault_aliases.json");

export type AliasMap = Record<string, string>;

export function readAliases(): AliasMap {
  if (!fs.existsSync(aliasFilePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(aliasFilePath, "utf-8"));
  } catch {
    return {};
  }
}

export function writeAliases(aliases: AliasMap): void {
  fs.writeFileSync(aliasFilePath, JSON.stringify(aliases, null, 2), "utf-8");
}

export function registerAliasCommand(program: Command): void {
  const alias = program
    .command("alias")
    .description("Manage key aliases in the vault");

  alias
    .command("set <alias> <key>")
    .description("Create an alias for a vault key")
    .action((aliasName: string, key: string) => {
      const aliases = readAliases();
      aliases[aliasName] = key;
      writeAliases(aliases);
      console.log(`Alias "${aliasName}" -> "${key}" saved.`);
    });

  alias
    .command("remove <alias>")
    .description("Remove an alias")
    .action((aliasName: string) => {
      const aliases = readAliases();
      if (!(aliasName in aliases)) {
        console.error(`Alias "${aliasName}" not found.`);
        process.exit(1);
      }
      delete aliases[aliasName];
      writeAliases(aliases);
      console.log(`Alias "${aliasName}" removed.`);
    });

  alias
    .command("list")
    .description("List all aliases")
    .action(() => {
      const aliases = readAliases();
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        console.log("No aliases defined.");
        return;
      }
      entries.forEach(([a, k]) => console.log(`${a} -> ${k}`));
    });

  alias
    .command("resolve <alias>")
    .description("Resolve an alias to its key")
    .action((aliasName: string) => {
      const aliases = readAliases();
      if (!(aliasName in aliases)) {
        console.error(`Alias "${aliasName}" not found.`);
        process.exit(1);
      }
      console.log(aliases[aliasName]);
    });
}
