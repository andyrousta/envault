import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault, writeVaultEntry } from "../vault";
import { decrypt, deriveKey } from "../crypto";

const prompt = (question: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

export function registerReceiveCommand(program: import("commander").Command) {
  program
    .command("receive <file>")
    .description("Import a secret from a shareable .env.share file into the vault")
    .option("-p, --password <password>", "Vault password")
    .option("-s, --share-password <password>", "Password used when the share was created")
    .option("--overwrite", "Overwrite existing key without prompting", false)
    .action(async (file: string, opts) => {
      try {
        const filePath = path.resolve(file);
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          process.exit(1);
        }

        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (raw.version !== 1 || !raw.data) {
          console.error("Invalid or unsupported share file format.");
          process.exit(1);
        }

        const sharePassword =
          opts.sharePassword || (await prompt("Share file password: "));
        const shareKey = await deriveKey(sharePassword, "share-salt-v1");
        const decrypted = await decrypt(raw.data, shareKey);
        const { key, value, tags } = JSON.parse(decrypted);

        const vaultPassword = opts.password || (await prompt("Vault password: "));
        const vault = await readVault(vaultPassword);

        if (vault[key] && !opts.overwrite) {
          const answer = await prompt(`Key "${key}" already exists. Overwrite? (y/N): `);
          if (answer.toLowerCase() !== "y") {
            console.log("Aborted.");
            return;
          }
        }

        await writeVaultEntry(vaultPassword, key, value, tags);
        console.log(`Secret "${key}" imported successfully.`);
      } catch (err: any) {
        console.error("Receive failed:", err.message);
        process.exit(1);
      }
    });
}
