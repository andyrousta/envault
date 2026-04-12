# `envault truncate`

Remove **all entries** from the vault, leaving it empty but intact.

This is useful when you want to start fresh without destroying the vault file itself.

## Usage

```bash
envault truncate [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-f, --force` | Skip the confirmation prompt |
| `--vault <path>` | Path to an alternative vault file |

## Examples

```bash
# Interactive — will ask for confirmation and master password
envault truncate

# Skip confirmation (useful in scripts)
envault truncate --force

# Target a specific vault file
envault truncate --vault /path/to/.envault
```

## Notes

- The vault file is **not deleted** — only its entries are cleared.
- You will be prompted for the master password to decrypt and re-encrypt the vault.
- This action is **irreversible**. Consider running `envault backup` first.
