import { Command } from 'commander';
import * as readline from 'readline';
import { vaultExists } from '../vault/vaultFile';
import { readVault } from '../vault/vaultFile';
import { decrypt } from '../crypto';

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = () => true;
    rl.question(question, (answer) => {
      process.stdout.write = stdoutWrite;
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

export function registerVerifyCommand(program: Command): void {
  program
    .command('verify')
    .description('Verify that the vault password is correct and the vault is intact')
    .option('-p, --path <path>', 'Path to vault file')
    .action(async (options) => {
      const vaultFile = options.path;

      if (!vaultExists(vaultFile)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const password = await promptPassword('Enter vault password: ');

      if (!password) {
        console.error('Password is required.');
        process.exit(1);
      }

      try {
        const raw = readVault(vaultFile);
        let decryptedCount = 0;
        let failedKeys: string[] = [];

        for (const [key, entry] of Object.entries(raw)) {
          try {
            await decrypt(entry.value, password);
            decryptedCount++;
          } catch {
            failedKeys.push(key);
          }
        }

        if (failedKeys.length === 0) {
          console.log(`✔ Vault verified successfully. ${decryptedCount} entr${decryptedCount === 1 ? 'y' : 'ies'} decrypted without errors.`);
        } else {
          console.error(`✘ Vault verification failed. Could not decrypt: ${failedKeys.join(', ')}`);
          process.exit(1);
        }
      } catch (err) {
        console.error('✘ Failed to verify vault. The password may be incorrect or the vault is corrupted.');
        process.exit(1);
      }
    });
}
