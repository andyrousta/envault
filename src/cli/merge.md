# `envault merge`

Merge environment variables from another vault file into the current vault.

## Usage

```bash
envault merge <source> [--overwrite]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `source` | Path to the source `.vault` file to merge from |

## Options

| Option | Description |
|--------|-------------|
| `--overwrite` | Overwrite existing keys in the target vault with values from the source vault. Default: `false` |

## Behavior

- Prompts for the **target vault** password (your current vault).
- Prompts for the **source vault** password (the vault you are merging from).
- Keys that exist only in the source are **added** to the target.
- Keys that already exist in the target are **skipped** unless `--overwrite` is specified.
- Reports a summary of added, overwritten, and skipped keys.

## Examples

```bash
# Merge from a teammate's exported vault (skip conflicts)
envault merge ./teammate.vault

# Merge and overwrite any conflicting keys
envault merge ./staging.vault --overwrite
```

## Notes

- Both vaults must be valid encrypted envault vault files.
- The source vault is **not modified** during a merge.
- Use `envault diff` to preview differences before merging.
