import { Command } from 'commander';
import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';
import { deriveKey, encrypt, decrypt } from '../crypto';

export function promptPassword(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    (rl as any).stdoutMuted = true;
    rl.question(query, (answer) => {
      rl.close();
      console.log();
      resolve(answer);
    });
    (rl as any)._writeToOutput = (s: string) => {
      if (!(rl as any).stdoutMuted) process.stdout.write(s);
    };
  });
}

export function registerRekeyCommand(program: Command): void {
  program
    .command('rekey')
    .description('Re-encrypt the vault with a new master password')
    .option('-p, --path <path>', 'Path to vault file')
    .action(async (options) => {
      const vaultFile = options.path;

      if (!vaultExists(vaultFile)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const oldPassword = await promptPassword('Current master password: ');
      let entries: Record<string, string>;

      try {
        entries = await readVault(vaultFile, oldPassword);
      } catch {
        console.error('Failed to decrypt vault. Incorrect password?');
        process.exit(1);
      }

      const newPassword = await promptPassword('New master password: ');
      const confirmPassword = await promptPassword('Confirm new master password: ');

      if (newPassword !== confirmPassword) {
        console.error('Passwords do not match.');
        process.exit(1);
      }

      if (newPassword.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
      }

      try {
        await writeVault(vaultFile, newPassword, entries);
        console.log('Vault successfully re-encrypted with new password.');
      } catch (err) {
        console.error('Failed to write vault:', (err as Error).message);
        process.exit(1);
      }
    });
}
