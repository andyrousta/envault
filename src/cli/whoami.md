# `envault whoami`

Manage the current envault user profile. The profile is stored locally at `~/.envault/profile.json` and is used for audit logs, history entries, and other identity-aware features.

## Subcommands

### `envault whoami show`

Display the currently configured profile.

```bash
envault whoami show
# Name:    Alice
# Email:   alice@example.com
# Created: 2024-01-15T10:30:00.000Z
```

### `envault whoami set`

Set or update the current profile.

```bash
envault whoami set --name "Alice" --email "alice@example.com"
# Profile saved for: Alice
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--name` | Yes | Your display name |
| `--email` | No | Your email address |

### `envault whoami clear`

Remove the saved profile.

```bash
envault whoami clear
# Profile cleared.
```

## Notes

- Profile data is stored at `~/.envault/profile.json`.
- The profile is **not** encrypted and should not contain sensitive data.
- Used by `envault history` and `envault audit` to attribute changes.
