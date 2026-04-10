# `envault tag` — Tag Vault Entries

Assign or remove metadata tags on vault entries to help organise and filter variables by environment, purpose, or team.

## Usage

```bash
# Add a tag to a key
envault tag <key> <tag>

# Remove a tag from a key
envault tag <key> <tag> --remove
```

## Examples

```bash
# Tag DATABASE_URL as belonging to production
envault tag DATABASE_URL production

# Tag API_KEY for the backend team
envault tag API_KEY backend

# Remove the staging tag from REDIS_URL
envault tag REDIS_URL staging --remove
```

## Options

| Option | Description |
|--------|-------------|
| `--remove` | Remove the specified tag instead of adding it |
| `--vault <path>` | Path to the vault directory (defaults to current directory) |

## Notes

- Tags are stored as metadata alongside the encrypted value and are visible after decryption.
- Use `envault search --tag <tag>` to filter entries by tag.
- Tags are case-sensitive: `Production` and `production` are treated as different tags.
- Multiple tags can be added to a single key by running the command multiple times.
