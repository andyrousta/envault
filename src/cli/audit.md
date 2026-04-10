# `envault audit`

Analyze the contents of your vault and surface potential issues without revealing secret values.

## Usage

```bash
envault audit [--json]
```

## Description

The `audit` command decrypts your vault using your password and produces a summary report including:

- **Total keys** stored in the vault
- **Keys with tags** vs keys without any tags
- **Empty values** — keys that exist but have no value set
- **Duplicate values** — different keys that share the same value (potential secret reuse)

No secret values are printed to the terminal.

## Options

| Flag     | Description                          |
|----------|--------------------------------------|
| `--json` | Output the audit report as JSON      |

## Examples

### Standard text report

```bash
$ envault audit
Enter vault password: ••••••••

=== Vault Audit Report ===

Total keys      : 12
Keys with tags  : 7
Keys w/o tags   : 5
Empty values    : 1
Duplicate values: DB_PASS, REDIS_PASS
```

### JSON output

```bash
$ envault audit --json
{
  "totalKeys": 12,
  "keysWithTags": 7,
  "keysWithoutTags": 5,
  "emptyValues": 1,
  "duplicateValues": ["DB_PASS", "REDIS_PASS"],
  "keys": ["API_KEY", "DB_PASS", ...]
}
```

## Notes

- The audit report is purely informational and does **not** modify the vault.
- Use `envault tag` to add tags to untagged keys.
- Use `envault set` to update or remove empty values.
