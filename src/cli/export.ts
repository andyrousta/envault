import * as readline from 'readline';
import { listEntries } from '../vault';

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runExport(format: 'dotenv' | 'json' = 'dotenv'): Promise<void> {
  try {
    const password = await promptPassword('Vault password: ');
    const entries = await listEntries(password);

    if (entries.length === 0) {
      console.log('No entries found in vault.');
      return;
    }

    if (format === 'json') {
      const obj: Record<string, string> = {};
      for (const { key, value } of entries) {
        obj[key] = value;
      }
      console.log(JSON.stringify(obj, null, 2));
    } else {
      for (const { key, value } of entries) {
        console.log(`${key}=${value}`);
      }
    }
  } catch (err: any) {
    console.error(`Error exporting vault: ${err.message}`);
  }
}
