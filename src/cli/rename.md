# `envault rename` Command

Rename an existing key in the vault without changing its value.

## Usage

```bash
envault rename <old-key> <new-key> [options]
```

## Arguments

| Argument    | Description                        |
|-------------|------------------------------------|
| `old-key`   | The existing key name to rename    |
| `new-key`   | The new key name to assign         |

## Options

| Option              | Description                              |
|---------------------|------------------------------------------|
| `-v, --vault <path>`| Path to vault file (default: `.envault`) |
| `-p, --password`    | Vault password (prompted if omitted)     |

## Examples

```bash
# Rename a key interactively
envault rename API_KEY THIRD_PARTY_API_KEY

# Rename using a specific vault file
envault rename DB_URL DATABASE_URL --vault .envault.staging
```

## Behavior

- Prompts for the vault password if `--password` is not provided.
- If the `<new-key>` already exists, you will be asked to confirm the overwrite.
- The original key is removed and the value is preserved under the new key.
- The vault is re-encrypted and saved after a successful rename.

## Error Cases

- Exits with an error if the vault file does not exist.
- Exits with an error if `<old-key>` is not found in the vault.
- Exits with an error if decryption fails (wrong password).
