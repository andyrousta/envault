# `envault dump`

Dump all vault entries to a plaintext file or stdout.

## Usage

```
envault dump [options]
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <file>` | Write output to a file instead of stdout | stdout |
| `-f, --format <format>` | Output format: `dotenv` or `json` | `dotenv` |
| `-p, --vault-path <path>` | Path to vault file | `.envault` in cwd |

## Examples

### Print all entries to stdout in dotenv format

```bash
envault dump
```

### Write entries to a `.env` file

```bash
envault dump --output .env
```

### Export as JSON

```bash
envault dump --format json --output secrets.json
```

## Notes

- You will be prompted for the vault password.
- The output is **plaintext** — handle with care and avoid committing to version control.
- Use `envault export` if you need an encrypted export.
