# `envault share`

Export a single encrypted secret to a portable `.env.share` file that can be sent to another person or machine.

## Usage

```bash
envault share <key> [options]
```

## Options

| Flag | Description | Default |
|------|-------------|--------|
| `-o, --output <file>` | Output file path | `shared.env.share` |
| `-p, --password <password>` | Vault password | prompted |
| `-s, --share-password <password>` | Password to protect the share file | prompted |

## Examples

```bash
# Share a secret interactively
envault share DATABASE_URL

# Specify output path and passwords inline
envault share API_KEY -o api_key.env.share -p myVaultPass -s sharePass123
```

## Notes

- The share file is encrypted with a **separate** password from your vault.
- Use `envault receive` to import a share file into another vault.
- Tags associated with the key are preserved in the share file.
- The share file format is versioned for forward compatibility.
