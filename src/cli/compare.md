# `envault compare`

Compare two vault files side-by-side and display the differences between their stored keys and values.

## Usage

```bash
envault compare <vaultA> <vaultB> [options]
```

## Arguments

| Argument | Description                      |
|----------|----------------------------------|
| `vaultA` | Path to the first vault file     |
| `vaultB` | Path to the second vault file    |

## Options

| Option          | Description                                        |
|-----------------|----------------------------------------------------|
| `--only-keys`   | Show only key names, not their values              |
| `--output <fmt>`| Output format: `text` (default) or `json`          |

## Output Format

- `- [only in A]` — Key exists in vault A but not vault B
- `+ [only in B]` — Key exists in vault B but not vault A
- `~ [changed]`   — Key exists in both but values differ

If no differences are found, the message `Vaults are identical.` is displayed.

### JSON Output

When using `--output json`, the result is a structured object suitable for scripting:

```json
{
  "onlyInA": ["KEY_ONE"],
  "onlyInB": ["KEY_TWO"],
  "changed": ["KEY_THREE"]
}
```

## Examples

```bash
# Full comparison with values
envault compare .env.vault .env.vault.backup

# Show only changed key names
envault compare staging.vault production.vault --only-keys

# Output differences as JSON for use in scripts
envault compare staging.vault production.vault --output json
```

## Notes

- Each vault is decrypted independently; you will be prompted for each password.
- Useful for auditing drift between environments (e.g., staging vs. production).
- Exit code `0` is returned when vaults are identical; `1` when differences are found.
