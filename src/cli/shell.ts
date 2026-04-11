import fs from "fs";
import path from "path";
import readline from "readline";
import { vaultExists, readVault } from "../vault";
import { decrypt } from "../crypto";

async function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function shellCommand(
  vaultDir: string,
  shell: string = process.env.SHELL || "/bin/sh"
): Promise<void> {
  if (!vaultExists(vaultDir)) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  const password = await promptPassword("Enter vault password: ");

  let vault: Record<string, string>;
  try {
    vault = await readVault(vaultDir, password);
  } catch {
    console.error("Failed to decrypt vault. Wrong password?");
    process.exit(1);
  }

  const envVars = { ...process.env };
  for (const [key, value] of Object.entries(vault)) {
    envVars[key] = value;
  }

  console.log(`Spawning shell with ${Object.keys(vault).length} vault variable(s) injected.`);

  const { spawnSync } = await import("child_process");
  const result = spawnSync(shell, { env: envVars, stdio: "inherit" });

  if (result.error) {
    console.error(`Failed to spawn shell: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}
