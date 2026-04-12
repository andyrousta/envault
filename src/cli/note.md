# `envault note`

Attach human-readable notes to individual vault entries. Notes are stored inside
the encrypted vault alongside the entry value and are never written to disk in
plaintext.

## Subcommands

### `note set <key>`

Prompts for the vault password and then for the note text. Saves the note on the
specified entry.

```bash
envault note set API_KEY
# Password: ••••••••
# Note for "API_KEY": Rotated 2024-06-01, expires 2025-06-01
```

Passing an empty string clears any existing note.

### `note get <key>`

Displays the note currently attached to an entry.

```bash
envault note get API_KEY
# Note for "API_KEY": Rotated 2024-06-01, expires 2025-06-01
```

If no note is set the command prints an informational message and exits cleanly.

### `note clear <key>`

Removes the note from an entry without affecting the stored value.

```bash
envault note clear API_KEY
# Note cleared for "API_KEY".
```

## Alias

`envault annotate <key> <text>` is a one-shot shorthand for `note set` that
accepts the note text directly as a positional argument, useful for scripting:

```bash
envault annotate DB_PASS "provisioned by terraform"
```

## Options

| Flag | Description |
|------|-------------|
| `--vault <path>` | Use an alternative vault file instead of the default |
