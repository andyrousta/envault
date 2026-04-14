# `envault clear`

Remove **all entries** from the current vault in one command.

## Usage

```bash
envault clear [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--vault <path>` | Path to a specific vault file (defaults to the project vault) |
| `--force` | Skip the interactive confirmation prompt |

## Behaviour

1. Checks that a vault exists in the current directory.
2. Unless `--force` is supplied, asks you to type `yes` to confirm the destructive operation.
3. Prompts for the master password to decrypt the vault.
4. Replaces the entries map with an empty object and re-encrypts the vault.
5. Prints the number of entries that were removed.

## Examples

```bash
# Interactive confirmation + password prompt
envault clear

# Skip confirmation (useful in scripts)
envault clear --force

# Target a specific vault file
envault clear --vault ./staging.vault
```

## Notes

- This operation is **irreversible** unless you have a snapshot or backup.
- Consider running `envault backup` or `envault snapshot` before clearing.
- The vault file itself is preserved; only the entries are removed.
