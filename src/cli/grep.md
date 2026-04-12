# envault grep

Search vault entry **values** using a regular expression pattern.

## Usage

```
envault grep <pattern> [options]
```

## Arguments

| Argument  | Description                        |
|-----------|------------------------------------|
| `pattern` | Regular expression to match against entry values |

## Options

| Flag               | Description                                         |
|--------------------|-----------------------------------------------------|
| `-k, --keys-only`  | Print only the keys of matching entries             |
| `-i, --ignore-case`| Perform case-insensitive matching                   |
| `-v, --invert`     | Show entries whose values do **not** match          |

## Examples

```bash
# Find all entries whose value contains a URL
envault grep "https?://"

# Find keys whose value contains "localhost" (case-insensitive)
envault grep -i localhost

# List only the keys that match
envault grep -k "^sk_"

# Show entries that do NOT contain a digit
envault grep -v "[0-9]"
```

## Notes

- You will be prompted for your vault password before results are shown.
- Values are matched in full; anchors (`^`, `$`) apply to the whole value string.
- Use `envault search` to search by **key** name instead.
