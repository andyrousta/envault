# `envault keys`

List all keys currently stored in the vault.

## Usage

```bash
envault keys [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-p, --password <password>` | Vault password (prompted if not provided) |
| `--json` | Output keys as a JSON array |
| `--count` | Print only the number of keys |
| `--prefix <prefix>` | Filter keys that start with the given prefix |

## Examples

### List all keys

```bash
envault keys
```

```
API_KEY
DB_HOST
DB_PASSWORD
SECRET_TOKEN
```

### Output as JSON

```bash
envault keys --json
```

```json
["API_KEY", "DB_HOST", "DB_PASSWORD", "SECRET_TOKEN"]
```

### Count keys

```bash
envault keys --count
```

```
4
```

### Filter by prefix

```bash
envault keys --prefix DB_
```

```
DB_HOST
DB_PASSWORD
```

## Notes

- Keys are always output in alphabetical order.
- The `--prefix` filter is case-sensitive.
- Combine `--prefix` with `--count` to count keys matching a namespace.
