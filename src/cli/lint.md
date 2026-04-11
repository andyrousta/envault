# `envault lint`

Lints vault entries for common issues such as non-standard key naming and weak or empty values.

## Usage

```bash
envault lint [options]
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --project <name>` | Project name to lint | Current directory name |

## Checks Performed

### ❌ Errors (exit code 1)

- **Key naming**: All keys must follow `SCREAMING_SNAKE_CASE` (e.g., `DATABASE_URL`, `API_KEY`). Keys starting with lowercase letters or containing hyphens will be flagged.

### ⚠️ Warnings

- **Empty values**: Keys with empty or whitespace-only values are flagged.
- **Weak values**: Values matching common placeholder patterns (e.g., `password`, `secret`, `123456`, `changeme`, or values shorter than 4 characters) are flagged.

## Examples

```bash
# Lint the current project vault
envault lint

# Lint a specific project
envault lint --project my-app
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No errors (warnings may still be present) |
| `1` | One or more errors found |
