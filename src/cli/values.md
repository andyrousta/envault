# `envault values`

List all decrypted values stored in the vault.

## Usage

```bash
envault values [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-k, --key <key>` | Filter output to a specific key's value |
| `--show-keys` | Display key names alongside values (e.g. `KEY=value`) |

## Examples

### List all values

```bash
envault values
```

Outputs each stored value on its own line (decrypted).

### List all values with keys

```bash
envault values --show-keys
```

Outputs `KEY=value` pairs, similar to a `.env` file.

### Get a single value

```bash
envault values --key DATABASE_URL
```

Prints only the value for `DATABASE_URL`.

## Notes

- You will be prompted for your vault password.
- Values are printed to stdout; suitable for piping.
- Use `envault get <key>` to retrieve a single value without listing all.
