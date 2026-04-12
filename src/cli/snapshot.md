# `snapshot` Command

The `snapshot` command lets you capture and manage named point-in-time copies of your vault's current state. Snapshots are stored locally as JSON files and can be used for auditing, rollback reference, or diffing against the current vault.

## Subcommands

### `envault snapshot save <label>`

Saves the current vault state under the given label.

```bash
envault snapshot save before-deploy
```

### `envault snapshot list`

Lists all saved snapshots.

```bash
envault snapshot list
# Output:
#   - before-deploy
#   - v1.2.0
```

### `envault snapshot delete <label>`

Deletes a named snapshot permanently.

```bash
envault snapshot delete before-deploy
```

## `snapshot-diff` Command

Compares the current vault against a previously saved snapshot and prints the differences.

```bash
envault snapshot-diff before-deploy
```

### Output format

| Prefix | Meaning                          |
|--------|----------------------------------|
| `+`    | Key added since the snapshot     |
| `-`    | Key removed since the snapshot   |
| `~`    | Key value changed since snapshot |

## Storage

Snapshots are saved in `.envault-snapshots/` next to your vault file. Each snapshot is a plain JSON file named `<label>.json`.

> **Note:** Snapshots store decrypted data. Ensure `.envault-snapshots/` is added to `.gitignore`.
