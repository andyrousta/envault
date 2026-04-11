# `envault lock` / `envault unlock`

Prevent accidental modifications to the vault by locking it.

## Usage

```bash
envault lock
envault unlock
```

## Description

The `lock` command creates a `.envault.lock` file alongside the vault. While
the lock file is present, any command that would modify the vault (e.g. `set`,
`delete`, `import`, `rotate`) will refuse to run and display an error.

The `unlock` command removes the lock file, restoring normal access.

## Examples

```bash
# Lock the vault before sharing a machine or stepping away
envault lock
# Vault locked successfully.

# Attempt to set a variable while locked
envault set API_KEY supersecret
# Error: Vault is locked. Use 'envault unlock' to unlock it before making changes.

# Unlock when ready to make changes again
envault unlock
# Vault unlocked successfully.
```

## Notes

- The lock file is a plain text file containing the ISO timestamp of when the
  lock was created.
- The lock file is named `.envault.lock` and lives in the same directory as
  the vault file.
- Locking does **not** encrypt or otherwise protect the vault beyond preventing
  CLI commands from writing to it. It is a soft guard, not a security boundary.
- Read-only commands such as `get`, `list`, `export`, and `search` are **not**
  blocked by the lock.
