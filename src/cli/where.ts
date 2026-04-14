import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import { vaultPath, vaultExists } from "../vault/vaultFile";

export function registerWhereCommand(program: Command): void {
  program
    .command("where")
    .description("Show the location of the vault file and related envault paths")
    .option("--vault", "Print only the vault file path")
    .option("--config", "Print only the config directory path")
    .option("--json", "Output as JSON")
    .action((opts) => {
      const vaultFile = vaultPath();
      const configDir = path.join(os.homedir(), ".envault");
      const exists = vaultExists();

      if (opts.vault) {
        console.log(vaultFile);
        return;
      }

      if (opts.config) {
        console.log(configDir);
        return;
      }

      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              vault: vaultFile,
              config: configDir,
              vaultExists: exists,
            },
            null,
            2
          )
        );
        return;
      }

      console.log(`Vault file   : ${vaultFile}`);
      console.log(`Config dir   : ${configDir}`);
      console.log(`Vault exists : ${exists ? "yes" : "no"}`);
    });
}
