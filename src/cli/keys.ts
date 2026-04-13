import { Command } from "commander";
import * as readline from "readline";
import { readVault } from "../vault";

export function promptPassword(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    (rl as any).stdoutMuted = true;
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer);
    });
    (rl as any)._writeToOutput = (s: string) => {
      if (!(rl as any).stdoutMuted) (rl as any).output.write(s);
    };
  });
}

export function registerKeysCommand(program: Command): void {
  program
    .command("keys")
    .description("List all keys stored in the vault")
    .option("-p, --password <password>", "vault password")
    .option("--json", "output as JSON array")
    .option("--count", "show only the count of keys")
    .option("--prefix <prefix>", "filter keys by prefix")
    .action(async (opts) => {
      try {
        const password = opts.password ?? (await promptPassword("Vault password: "));
        const vault = await readVault(password);
        let keys = Object.keys(vault);

        if (opts.prefix) {
          keys = keys.filter((k) => k.startsWith(opts.prefix));
        }

        keys.sort();

        if (opts.count) {
          console.log(keys.length);
          return;
        }

        if (opts.json) {
          console.log(JSON.stringify(keys, null, 2));
          return;
        }

        if (keys.length === 0) {
          console.log("No keys found.");
          return;
        }

        keys.forEach((key) => console.log(key));
      } catch (err: any) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
}
