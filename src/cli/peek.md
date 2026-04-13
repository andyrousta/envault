# envault peek

Preview the value of a stored environment variable with optional masking.

## Usage

```
envault peek <key> [options]
```

## Arguments

| Argument | Description                          |
|----------|--------------------------------------|
| `key`    | The name of the environment variable |

## Options

| Option              | Description                                          | Default |
|---------------------|------------------------------------------------------|---------|
| `-r, --reveal`      | Show the full value unmasked                         | false   |
| `-n, --chars <n>`   | Number of trailing characters to reveal when masking | `4`     |

## Examples

```bash
# Peek at a key with default masking (last 4 chars visible)
envault peek DATABASE_URL
# DATABASE_URL=********************3306

# Reveal the full value
envault peek DATABASE_URL --reveal
# DATABASE_URL=postgres://user:pass@localhost:3306/db

# Show only the last 2 characters
envault peek API_KEY --chars 2
# API_KEY=********************7f
```

## Notes

- You will be prompted for your vault password.
- By default, all but the last 4 characters are replaced with `*`.
- Use `--reveal` to display the full plaintext value.
