# `envault pin`

Pin a specific environment variable to protect it from accidental deletion or overwrite.

## Usage

```bash
envault pin <key>
envault pin <key> --unpin
```

## Arguments

| Argument | Description                        |
|----------|------------------------------------|
| `key`    | The environment variable key to pin |

## Options

| Flag       | Description                          |
|------------|--------------------------------------|
| `--unpin`  | Remove the pin from the variable     |

## Examples

```bash
# Pin a variable
envault pin DATABASE_URL

# Unpin a variable
envault pin DATABASE_URL --unpin
```

## Notes

- Pinned variables are marked with `pinned: true` in the vault.
- Attempting to delete or overwrite a pinned variable via `set` or `delete` will warn the user.
- The vault password is required to modify pin status.
