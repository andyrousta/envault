import fs from "fs";
import path from "path";
import readline from "readline";
import { Command } from "commander";
import { vaultPath, vaultExists, readVault, writeVault } from "../vault/vaultFile";
import { deriveKey } from "../crypto/vault";

const VALID_MODES = ["owner", "shared", "readonly"] as const;
type VaultMode = typeof VALID_MODES[number];

const MODE_FILE = ".envault-mode";

export function modePath(dir: string = process.cwd()): string {
  return path.join(dir, MODE_FILE);
}

export function readMode(dir: string = process.cwd()): VaultMode {
  const p = modePath(dir);
  if (!fs.existsSync(p)) return "owner";
  const raw = fs.readFileSync(p, "utf-8").trim() as VaultMode;
  return VALID_MODES.includes(raw) ? raw : "owner";
}

export function writeMode(mode: VaultMode, dir: string = process.cwd()): void {
  fs.writeFileSync(modePath(dir), mode, "utf-8");
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerChmodCommand(program: Command): void {
  program
    .command("chmod <mode>")
    .description("Set vault access mode: owner | shared | readonly")
    .option("--dir <path>", "vault directory", process.cwd())
    .action(async (mode: string, opts: { dir: string }) => {
      if (!VALID_MODES.includes(mode as VaultMode)) {
        console.error(`Invalid mode "${mode}". Choose from: ${VALID_MODES.join(", ")}`);
        process.exit(1);
      }

      if (!vaultExists(opts.dir)) {
        console.error("No vault found in this directory. Run `envault init` first.");
        process.exit(1);
      }

      const password = await prompt("Master password: ");
      try {
        await readVault(opts.dir, await deriveKey(password, opts.dir));
      } catch {
        console.error("Invalid password.");
        process.exit(1);
      }

      const current = readMode(opts.dir);
      writeMode(mode as VaultMode, opts.dir);
      console.log(`Vault mode changed: ${current} → ${mode}`);
    });

  program
    .command("chmod:get")
    .description("Show current vault access mode")
    .option("--dir <path>", "vault directory", process.cwd())
    .action((opts: { dir: string }) => {
      if (!vaultExists(opts.dir)) {
        console.error("No vault found in this directory.");
        process.exit(1);
      }
      console.log(`Current vault mode: ${readMode(opts.dir)}`);
    });
}
