import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault } from "../vault";
import { encrypt, deriveKey } from "../crypto";

const prompt = (question: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

export function registerShareCommand(program: import("commander").Command) {
  program
    .command("share <key>")
    .description("Export a single encrypted secret to a shareable .env.share file")
    .option("-o, --output <file>", "Output file path", "shared.env.share")
    .option("-p, --password <password>", "Vault password")
    .option("-s, --share-password <password>", "Password for the share file")
    .action(async (key: string, opts) => {
      try {
        const password = opts.password || (await prompt("Vault password: "));
        const vault = await readVault(password);

        const entry = vault[key];
        if (!entry) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        const sharePassword =
          opts.sharePassword || (await prompt("Share file password: "));

        const payload = JSON.stringify({ key, value: entry.value, tags: entry.tags ?? [] });
        const shareKey = await deriveKey(sharePassword, "share-salt-v1");
        const encrypted = await encrypt(payload, shareKey);

        const outputPath = path.resolve(opts.output);
        fs.writeFileSync(outputPath, JSON.stringify({ version: 1, data: encrypted }, null, 2));
        console.log(`Shared secret "${key}" written to ${outputPath}`);
      } catch (err: any) {
        console.error("Share failed:", err.message);
        process.exit(1);
      }
    });
}
