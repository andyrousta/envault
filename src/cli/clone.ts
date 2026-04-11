import fs from "fs";
import path from "path";
import readline from "readline";
import { vaultPath, vaultExists, readVault, writeVault } from "../vault";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function registerCloneCommand(program: import("commander").Command) {
  program
    .command("clone <source> <destination>")
    .description("Clone a vault to a new location with optional re-encryption")
    .option("--rekey", "Re-encrypt the cloned vault with a new password")
    .action(async (source: string, destination: string, options: { rekey?: boolean }) => {
      const sourcePath = path.resolve(source);
      const destPath = path.resolve(destination);

      if (!fs.existsSync(sourcePath)) {
        console.error(`Source vault not found: ${sourcePath}`);
        process.exit(1);
      }

      if (fs.existsSync(destPath)) {
        const overwrite = await prompt(`Destination already exists. Overwrite? (y/N): `);
        if (overwrite.toLowerCase() !== "y") {
          console.log("Aborted.");
          return;
        }
      }

      try {
        if (options.rekey) {
          const oldPassword = await prompt("Enter current vault password: ");
          const vault = await readVault(sourcePath, oldPassword);
          const newPassword = await prompt("Enter new password for cloned vault: ");
          const confirm = await prompt("Confirm new password: ");
          if (newPassword !== confirm) {
            console.error("Passwords do not match.");
            process.exit(1);
          }
          await writeVault(destPath, vault, newPassword);
          console.log(`Vault cloned and re-encrypted to: ${destPath}`);
        } else {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Vault cloned to: ${destPath}`);
        }
      } catch (err: any) {
        console.error(`Clone failed: ${err.message}`);
        process.exit(1);
      }
    });
}
