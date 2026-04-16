# `envault env-check`

Check which vault keys are present or missing in the current environment.

## Usage

```bash
envault env-check [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-p, --password <password>` | Vault password (or set `ENVAULT_PASSWORD`) |
| `--missing` | Show only keys missing from the environment |
| `--json` | Output results as JSON |

## Examples

### Show all vault keys and their env status

```bash
envault env-check --password secret
```

```
DB_HOST                        ✔ set
DB_PASSWORD                    ✘ missing
API_KEY                        ✔ set
```

### Show only missing keys

```bash
envault env-check --password secret --missing
```

```
DB_PASSWORD                    ✘ missing
```

### JSON output for scripting

```bash
envault env-check --password secret --json
```

```json
[
  { "key": "DB_HOST", "presentInVault": true, "presentInEnv": true },
  { "key": "DB_PASSWORD", "presentInVault": true, "presentInEnv": false }
]
```

## Notes

- Only vault keys are checked; extra environment variables not in the vault are ignored.
- Use `--missing` in CI scripts to fail fast when required env vars are absent.
