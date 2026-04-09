import * as readline from 'readline';
import { vaultExists, readVault, writeVault } from '../vault';
import { encrypt, decrypt } from '../crypto';

export function promptPassword(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    let input = '';
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function handler(char) {
      if (char === '\n' || char === '\r') {
        process.stdin.setRawMode?.(false);
        process.stdin.removeListener('data', handler);
        process.stdout.write('\n');
        rl.close();
        resolve(input);
      } else if (char === '\u0003') {
        process.exit();
      } else {
        input += char;
      }
    });
  });
}

export async function rotateCommand(vaultFile: string): Promise<void> {
  if (!vaultExists(vaultFile)) {
    console.error('No vault found. Run `envault init` first.');
    process.exit(1);
  }

  const oldPassword = await promptPassword('Current master password: ');
  const vault = readVault(vaultFile, oldPassword);

  if (!vault) {
    console.error('Invalid password or corrupted vault.');
    process.exit(1);
  }

  const newPassword = await promptPassword('New master password: ');
  const confirmPassword = await promptPassword('Confirm new master password: ');

  if (newPassword !== confirmPassword) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  if (newPassword.trim().length === 0) {
    console.error('Password cannot be empty.');
    process.exit(1);
  }

  const reEncrypted: Record<string, string> = {};
  for (const [key, encryptedValue] of Object.entries(vault)) {
    const plaintext = decrypt(encryptedValue, oldPassword);
    reEncrypted[key] = encrypt(plaintext, newPassword);
  }

  writeVault(vaultFile, reEncrypted);
  console.log(`Password rotated successfully. ${Object.keys(reEncrypted).length} entries re-encrypted.`);
}
