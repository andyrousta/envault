# envault mv

Move a vault entry from one key to another. This is equivalent to copying the value and metadata to the new key and deleting the old one — all within the same encrypted vault.

## Usage

```
envault mv <source> <destination> [options]
```

## Arguments

| Argument      | Description                        |
|---------------|------------------------------------|
| `source`      | The existing key to move           |
| `destination` | The new key name                   |

## Options

| Flag            | Description                                          |
|-----------------|------------------------------------------------------|
| `-f, --force`   | Overwrite destination key if it already exists       |

## Examples

```bash
# Move DATABASE_URL to DB_URL
envault mv DATABASE_URL DB_URL

# Move and overwrite an existing key
envault mv OLD_SECRET NEW_SECRET --force
```

## Notes

- Tags and notes attached to the source entry are preserved on the destination.
- The source key is removed after a successful move.
- You will be prompted for your vault password.
