import { Command } from 'commander';
import * as readline from 'readline';
import { readVault } from '../vault';

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    process.stderr.write(question);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        process.stderr.write('\n');
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit(1);
      } else {
        password += c;
      }
    });
  });
}

export function registerCountCommand(program: Command): void {
  program
    .command('count')
    .description('Count the number of entries in the vault')
    .option('--tag <tag>', 'Count only entries with a specific tag')
    .option('--json', 'Output result as JSON')
    .action(async (opts) => {
      try {
        const password = await promptPassword('Vault password: ');
        const vault = await readVault(password);
        const entries = vault.entries ?? [];

        const filtered = opts.tag
          ? entries.filter((e: any) =>
              Array.isArray(e.tags) && e.tags.includes(opts.tag)
            )
          : entries;

        const count = filtered.length;

        if (opts.json) {
          console.log(JSON.stringify({ count, tag: opts.tag ?? null }));
        } else if (opts.tag) {
          console.log(`Entries tagged "${opts.tag}": ${count}`);
        } else {
          console.log(`Total entries: ${count}`);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
