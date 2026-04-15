# envault rename

Rename an existing key in the vault without changing its value.

## Usage

```
envault rename <oldKey> <newKey> [options]
```

## Aliases

```
envault mv <oldKey> <newKey> [options]
```

## Arguments

| Argument  | Description                        |
|-----------|------------------------------------|
| `oldKey`  | The current name of the vault key  |
| `newKey`  | The new name to assign to the key  |

## Options

| Option           | Description                            |
|------------------|----------------------------------------|
| `-p, --path`     | Path to the vault file (optional)      |

## Examples

Rename a key interactively:
```
envault rename DATABASE_URL DB_URL
```

Rename using the `mv` alias:
```
envault mv API_KEY API_SECRET
```

Rename a key in a specific vault:
```
envault rename OLD_TOKEN NEW_TOKEN --path ./staging.vault
```

## Notes

- If `newKey` already exists in the vault, the command will abort to prevent accidental overwrites.
- You will be prompted for the vault password to decrypt and re-encrypt the vault.
- The value associated with the key is preserved exactly as stored.
