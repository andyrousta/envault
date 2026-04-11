# `envault info`

Display metadata and statistics about the current vault without decrypting any entries.

## Usage

```bash
envault info
```

## Output

The command prints a summary table including:

| Field         | Description                                      |
|---------------|--------------------------------------------------|
| Path          | Absolute path to the vault file on disk          |
| Size          | File size in human-readable format (B / KB / MB) |
| Entries       | Total number of stored environment variables     |
| Unique Tags   | Number of distinct tags across all entries       |
| Last Modified | Timestamp of the last write to the vault file    |
| Created       | Timestamp when the vault file was first created  |

## Example

```
Vault Info
────────────────────────────────────────
  Path:          /home/user/project/.envault
  Size:          3.2 KB
  Entries:       12
  Unique Tags:   4
  Last Modified: 6/1/2024, 12:00:00 PM
  Created:       1/15/2024, 8:30:00 AM
────────────────────────────────────────
```

## Notes

- No password is required — this command reads only unencrypted metadata.
- Run `envault list` to see all entry keys, or `envault get <key>` to decrypt a value.
- If no vault exists, the command exits with a non-zero status and a helpful message.
