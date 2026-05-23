# `envault touch`

Update the "last modified" timestamp of one or more vault entries without changing their values.

## Usage

```bash
envault touch <key> [key2 ...] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `key`    | One or more entry keys to touch |

## Options

| Flag | Description |
|------|-------------|
| `-p, --path <path>` | Path to vault file (default: `.envault`) |

## Examples

```bash
# Touch a single key
envault touch DATABASE_URL

# Touch multiple keys at once
envault touch API_KEY SECRET_TOKEN DATABASE_URL

# Touch a key in a specific vault
envault touch DATABASE_URL --path ./production.vault
```

## Notes

- The entry must already exist in the vault.
- Only the `updatedAt` timestamp is modified; the value remains unchanged.
- Useful for marking entries as "reviewed" or triggering change-detection workflows.
