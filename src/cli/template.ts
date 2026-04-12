import fs from "fs";
import path from "path";
import readline from "readline";
import { readVault, writeVault } from "../vault";
import { VaultEntry } from "../vault/vaultEntry";

const TEMPLATES_DIR = path.join(process.cwd(), ".envault", "templates");

export function templateFilePath(name: string): string {
  return path.join(TEMPLATES_DIR, `${name}.json`);
}

export function listTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function saveTemplate(name: string, keys: string[]): void {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  fs.writeFileSync(templateFilePath(name), JSON.stringify(keys, null, 2));
}

export function loadTemplate(name: string): string[] {
  const filePath = templateFilePath(name);
  if (!fs.existsSync(filePath)) throw new Error(`Template "${name}" not found.`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function deleteTemplate(name: string): void {
  const filePath = templateFilePath(name);
  if (!fs.existsSync(filePath)) throw new Error(`Template "${name}" not found.`);
  fs.unlinkSync(filePath);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerTemplateCommand(program: import("commander").Command): void {
  const cmd = program.command("template").description("Manage reusable vault key templates");

  cmd
    .command("save <name>")
    .description("Save current vault keys as a named template")
    .option("-p, --password <password>", "vault password")
    .action(async (name: string, opts: { password?: string }) => {
      const password = opts.password ?? (await prompt("Password: "));
      const vault = await readVault(password);
      const keys = vault.map((e: VaultEntry) => e.key);
      saveTemplate(name, keys);
      console.log(`Template "${name}" saved with ${keys.length} key(s).`);
    });

  cmd
    .command("apply <name>")
    .description("Add missing keys from a template to the vault with empty values")
    .option("-p, --password <password>", "vault password")
    .action(async (name: string, opts: { password?: string }) => {
      const password = opts.password ?? (await prompt("Password: "));
      const keys = loadTemplate(name);
      const vault = await readVault(password);
      const existing = new Set(vault.map((e: VaultEntry) => e.key));
      let added = 0;
      for (const key of keys) {
        if (!existing.has(key)) {
          vault.push({ key, value: "", tags: [], createdAt: new Date().toISOString() });
          added++;
        }
      }
      await writeVault(vault, password);
      console.log(`Applied template "${name}": ${added} key(s) added.`);
    });

  cmd
    .command("list")
    .description("List all saved templates")
    .action(() => {
      const templates = listTemplates();
      if (templates.length === 0) return console.log("No templates found.");
      templates.forEach((t) => console.log(` - ${t}`));
    });

  cmd
    .command("delete <name>")
    .description("Delete a saved template")
    .action((name: string) => {
      deleteTemplate(name);
      console.log(`Template "${name}" deleted.`);
    });
}
