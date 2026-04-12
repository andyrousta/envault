# `envault tail`

Show the last N entries stored in the vault.

## Usage

```
envault tail [options]
```

## Options

| Option | Description | Default |
|---|---|---|
| `-n, --lines <number>` | Number of entries to display | `10` |
| `-t, --tag <tag>` | Filter entries by tag | — |
| `-p, --password <password>` | Vault password (prompted if omitted) | — |

## Examples

```bash
# Show the last 10 entries
envault tail

# Show the last 5 entries
envault tail -n 5

# Show the last 3 entries tagged "production"
envault tail -n 3 --tag production
```

## Notes

- Entries are shown in insertion order (last N added).
- Values are decrypted before display — use with care in shared terminals.
- Combine with `--tag` to narrow results to a specific environment or group.
