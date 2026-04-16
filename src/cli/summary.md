# `envault summary`

Display a high-level summary of the current vault's contents.

## Usage

```
envault summary [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-v, --vault <path>` | Path to a custom vault file |

## Output

The command prints:

- **Total entries** — number of key/value pairs stored
- **Decryptable** — how many entries could be decrypted with the provided password
- **Tags** — unique tags assigned to entries
- **Oldest entry** — ISO timestamp of the earliest created entry
- **Newest entry** — ISO timestamp of the most recently created entry

## Example

```
$ envault summary
Password: ••••••••
Total entries : 12
Decryptable   : 12
Tags          : production, staging
Oldest entry  : 2024-01-15T10:00:00.000Z
Newest entry  : 2024-11-03T08:42:11.000Z
```

## Notes

- Entries without a `createdAt` field are excluded from date calculations.
- If no password is provided or decryption fails, `Decryptable` will reflect partial results.
