import { Command } from 'commander';
import { readVault } from '../vault';
import { decrypt } from '../crypto';
import * as readline from 'readline';

async function promptPassword(msg: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, ans => { rl.close(); resolve(ans); }));
}

export function registerSummaryCommand(program: Command): void {
  program
    .command('summary')
    .description('Show a summary of vault contents: key count, tags, oldest/newest entries')
    .option('-v, --vault <path>', 'path to vault file')
    .action(async (opts) => {
      try {
        const password = await promptPassword('Password: ');
        const raw = await readVault(opts.vault);
        const entries = await Promise.all(
          raw.map(async (e: any) => ({
            key: e.key,
            tag: e.tag ?? null,
            createdAt: e.createdAt ?? null,
            value: await decrypt(e.encrypted, password).catch(() => null),
          }))
        );

        const total = entries.length;
        const tags = [...new Set(entries.map(e => e.tag).filter(Boolean))];
        const dated = entries.filter(e => e.createdAt).map(e => new Date(e.createdAt).getTime());
        const oldest = dated.length ? new Date(Math.min(...dated)).toISOString() : 'N/A';
        const newest = dated.length ? new Date(Math.max(...dated)).toISOString() : 'N/A';
        const decrypted = entries.filter(e => e.value !== null).length;

        console.log(`Total entries : ${total}`);
        console.log(`Decryptable   : ${decrypted}`);
        console.log(`Tags          : ${tags.length ? tags.join(', ') : '(none)'}`);
        console.log(`Oldest entry  : ${oldest}`);
        console.log(`Newest entry  : ${newest}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
