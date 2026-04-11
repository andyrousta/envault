import type { Argv } from "yargs";
import { shellCommand } from "./shell";
import path from "path";

export function registerShellCommand(cli: Argv): Argv {
  return cli.command(
    "shell",
    "Spawn a shell with vault variables injected into the environment",
    (yargs) =>
      yargs.option("shell", {
        alias: "s",
        type: "string",
        description: "Path to shell binary",
        default: process.env.SHELL || "/bin/sh",
      }),
    async (argv) => {
      const vaultDir = path.resolve(process.cwd());
      await shellCommand(vaultDir, argv.shell as string);
    }
  );
}
