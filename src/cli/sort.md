# `envault sort`

Sort all entries in the vault alphabetically by key or value.

## Usage

```bash
envault sort [options]
```

## Options

| Option       | Description                          |
|--------------|--------------------------------------|
| `--desc`     | Sort in descending order (Z → A)     |
| `--by-value` | Sort entries by value instead of key |

## Examples

### Sort keys A → Z (default)

```bash
envault sort
```

### Sort keys Z → A

```bash
envault sort --desc
```

### Sort by value ascending

```bash
envault sort --by-value
```

### Sort by value descending

```bash
envault sort --by-value --desc
```

## Notes

- Requires your vault password to decrypt and re-encrypt the vault.
- The vault file is updated in place with the new entry order.
- Sorting is locale-aware using `localeCompare`.
