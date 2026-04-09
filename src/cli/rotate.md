# `envault rotate` — Password Rotation

The `rotate` command allows you to change the master password for an existing vault.
All stored entries are re-encrypted using the new password transparently.

## Usage

```bash
envault rotate
```

## Flow

1. Prompts for the **current** master password.
2. Decrypts and validates the vault.
3. Prompts for a **new** master password (entered twice for confirmation).
4. Re-encrypts every entry in the vault using the new password.
5. Overwrites the vault file with the newly encrypted data.

## Security Notes

- The old password is never stored; it is only used in-memory during rotation.
- If the process is interrupted mid-rotation, the vault file is **not** partially written — the write is atomic (write then replace).
- Choosing a strong, unique password is recommended. `envault` uses AES-256-GCM via PBKDF2 key derivation.

## Example

```
$ envault rotate
Current master password: ********
New master password: ************
Confirm new master password: ************
Password rotated successfully. 4 entries re-encrypted.
```

## Errors

| Situation | Message |
|---|---|
| Vault not initialized | `No vault found. Run envault init first.` |
| Wrong current password | `Invalid password or corrupted vault.` |
| New passwords don't match | `Passwords do not match.` |
| Empty new password | `Password cannot be empty.` |
