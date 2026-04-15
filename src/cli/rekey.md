# `envault rekey`

Re-encrypts the vault using a new master password, while preserving all existing entries.

## Usage

```bash
envault rekey [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-p, --path <path>` | Path to the vault file (defaults to `.envault`) |

## Description

The `rekey` command allows you to change the master password used to encrypt your vault. It will:

1. Prompt for your **current** master password to decrypt the vault.
2. Prompt for a **new** master password (minimum 8 characters).
3. Ask you to **confirm** the new password.
4. Re-encrypt all entries with the new password and overwrite the vault file.

This is useful when rotating credentials, onboarding new team members, or following security best practices.

## Example

```bash
$ envault rekey
Current master password: ********
New master password: ************
Confirm new master password: ************
Vault successfully re-encrypted with new password.
```

## Notes

- The new password must be at least 8 characters long.
- If the current password is incorrect, the operation is aborted.
- If the new passwords do not match, the operation is aborted.
- The original vault is overwritten in place — consider running `envault backup` beforehand.
