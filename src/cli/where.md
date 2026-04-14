# envault where

Show the location of the vault file and related envault configuration paths.

## Usage

```bash
envault where [options]
```

## Options

| Flag       | Description                          |
|------------|--------------------------------------|
| `--vault`  | Print only the vault file path       |
| `--config` | Print only the config directory path |
| `--json`   | Output all paths as JSON             |

## Examples

```bash
# Show all paths in human-readable format
envault where

# Output:
# Vault file   : /home/user/.envault/vault.enc
# Config dir   : /home/user/.envault
# Vault exists : yes

# Print only the vault path (useful for scripting)
envault where --vault
# /home/user/.envault/vault.enc

# Print only the config directory
envault where --config
# /home/user/.envault

# Output as JSON
envault where --json
```

## Notes

- The vault file path is derived from `ENVAULT_PATH` environment variable if set, otherwise defaults to `~/.envault/vault.enc`.
- The config directory is always `~/.envault`.
