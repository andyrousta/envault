import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { vaultExists, writeVault } from "../vault/vaultFile";
import { deriveKey } from "../crypto/vault";
import { randomBytes } from "crypto";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function initVault(vaultDir?: string): Promise<void> {
  const targetDir = vaultDir ?? process.cwd();

  if (vaultExists(targetDir)) {
    console.error("A vault already exists in this directory.");
    process.exit(1);
  }

  console.log("Initializing a new envault vault...");

  const password = await prompt("Enter a master password: ");
  if (!password || password.trim().length === 0) {
    console.error("Password cannot be empty.");
    process.exit(1);
  }

  const salt = randomBytes(16).toString("hex");
  await deriveKey(password, salt);

  const initialVault = {
    version: 1,
    salt,
    entries: {},
  };

  writeVault(targetDir, initialVault);

  console.log(`Vault initialized at ${path.join(targetDir, ".envault")}`);
  console.log("Keep your master password safe — it cannot be recovered.");
}
