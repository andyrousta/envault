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

| Option        | Description                              |
|---------------|------------------------------------------|
| `--only-keys` | Show only key names, not their values    |

## Output Format

- `- [only in A]` — Key exists in vault A but not vault B
- `+ [only in B]` — Key exists in vault B but not vault A
- `~ [changed]`   — Key exists in both but values differ

If no differences are found, the message `Vaults are identical.` is displayed.

## Examples

```bash
# Full comparison with values
envault compare .env.vault .env.vault.backup

# Show only changed key names
envault compare staging.vault production.vault --only-keys
```

## Notes

- Each vault is decrypted independently; you will be prompted for each password.
- Useful for auditing drift between environments (e.g., staging vs. production).
