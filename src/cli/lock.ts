import fs from "fs";
import path from "path";
import { vaultPath, vaultExists } from "../vault/vaultFile";

const LOCK_FILE_NAME = ".envault.lock";

export function lockFilePath(vaultDir?: string): string {
  const dir = vaultDir ?? path.dirname(vaultPath());
  return path.join(dir, LOCK_FILE_NAME);
}

export function isLocked(vaultDir?: string): boolean {
  return fs.existsSync(lockFilePath(vaultDir));
}

export function acquireLock(vaultDir?: string): void {
  if (!vaultExists()) {
    throw new Error("No vault found. Run 'envault init' first.");
  }
  const lockPath = lockFilePath(vaultDir);
  if (fs.existsSync(lockPath)) {
    throw new Error(
      "Vault is already locked. Use 'envault unlock' to remove the lock."
    );
  }
  fs.writeFileSync(lockPath, new Date().toISOString(), "utf-8");
  console.log("Vault locked successfully.");
}

export function releaseLock(vaultDir?: string): void {
  const lockPath = lockFilePath(vaultDir);
  if (!fs.existsSync(lockPath)) {
    console.log("Vault is not locked.");
    return;
  }
  fs.rmSync(lockPath);
  console.log("Vault unlocked successfully.");
}

export function assertNotLocked(vaultDir?: string): void {
  if (isLocked(vaultDir)) {
    throw new Error(
      "Vault is locked. Use 'envault unlock' to unlock it before making changes."
    );
  }
}

export function registerLockCommand(program: import("commander").Command): void {
  program
    .command("lock")
    .description("Lock the vault to prevent modifications")
    .action(() => {
      try {
        acquireLock();
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .command("unlock")
    .description("Unlock the vault to allow modifications")
    .action(() => {
      try {
        releaseLock();
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });
}
