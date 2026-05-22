# `envault slice`

Output a slice of vault entries by index range (inclusive).

## Usage

```bash
envault slice <start> <end> [options]
```

## Arguments

| Argument | Description                          |
|----------|--------------------------------------|
| `start`  | Start index (0-based, inclusive)     |
| `end`    | End index (0-based, inclusive)       |

## Options

| Option        | Description                        |
|---------------|------------------------------------|
| `--dir <dir>` | Path to the vault directory        |

## Description

The `slice` command lets you view a subset of your vault entries based on
their positional index. Entries are ordered as stored in the vault file.

You will be prompted for your vault password before entries are displayed.

## Examples

```bash
# Show the first 5 entries (indices 0–4)
envault slice 0 4

# Show entries at positions 10 through 19
envault slice 10 19

# Use a custom vault directory
envault slice 0 2 --dir /path/to/vault
```

## Notes

- Indices are 0-based.
- If the range extends beyond the number of entries, only available entries are shown.
- If no entries exist in the range, a message is printed and the command exits cleanly.
