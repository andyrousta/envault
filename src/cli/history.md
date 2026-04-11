# `envault history`

Display a log of recent vault actions such as `set`, `delete`, `rotate`, and `import`.

## Usage

```bash
envault history [options]
```

## Options

| Flag | Description | Default |
|------|-------------|--------|
| `-n, --limit <number>` | Number of recent entries to show | `20` |
| `-k, --key <key>` | Filter entries by key name | — |

## Examples

```bash
# Show last 20 actions
envault history

# Show last 50 actions
envault history -n 50

# Show history for a specific key
envault history --key DATABASE_URL
```

## Notes

- History is stored in `.envault.history.json` in the current project directory.
- A maximum of **200 entries** are retained; older entries are automatically pruned.
- History entries are recorded automatically by commands such as `set`, `delete`, `rotate`, `import`, and `copy`.
- The history file is **not encrypted** — avoid storing sensitive details in the `detail` field.
