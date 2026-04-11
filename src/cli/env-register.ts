import type { Argv } from "yargs";
import { vaultPath } from "../vault";
import { envCommand } from "./env";

export function registerEnvCommand(yargs: Argv): Argv {
  return yargs.command(
    "env [cmd...]",
    "Inject vault variables into shell or run a command with them",
    (y) =>
      y
        .positional("cmd", {
          describe: "Command and arguments to run with vault vars injected",
          type: "string",
          array: true,
          default: [],
        })
        .option("shell", {
          type: "boolean",
          describe: "Run the subprocess via the system shell",
          default: false,
        })
        .example(
          "$0 env",
          "Print export statements for all vault entries"
        )
        .example(
          "$0 env -- node server.js",
          "Run node with vault vars in the environment"
        ),
    async (argv) => {
      const cmd = (argv.cmd as string[]) ?? [];
      await envCommand(vaultPath(), cmd, { shell: argv.shell as boolean });
    }
  );
}
