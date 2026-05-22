import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readVault } from '../vault';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerDumpCommand(program: Command): void {
  program
    .command('dump')
    .description('Dump all vault entries to a plaintext file or stdout')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .option('-f, --format <format>', 'Output format: dotenv or json (default: dotenv)', 'dotenv')
    .option('-p, --vault-path <path>', 'Path to vault file')
    .action(async (opts) => {
      try {
        const password = await promptPassword('Vault password: ');
        const vaultFilePath = opts.vaultPath || path.join(process.cwd(), '.envault');
        const entries = await readVault(vaultFilePath, password);

        let output: string;
        if (opts.format === 'json') {
          const obj: Record<string, string> = {};
          for (const entry of entries) {
            obj[entry.key] = entry.value;
          }
          output = JSON.stringify(obj, null, 2);
        } else {
          output = entries
            .map((e) => `${e.key}=${e.value}`)
            .join('\n');
        }

        if (opts.output) {
          fs.writeFileSync(opts.output, output + '\n', 'utf8');
          console.error(`Dumped ${entries.length} entries to ${opts.output}`);
        } else {
          console.log(output);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
