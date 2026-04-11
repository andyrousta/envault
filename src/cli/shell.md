# `envault shell`

Spawn an interactive shell session with all vault variables injected into the environment.

## Usage

```bash
envault shell [--shell <path>]
```

## Options

| Option | Description | Default |
|--------|-------------|--------|
| `--shell` | Path to the shell binary to spawn | `$SHELL` or `/bin/sh` |

## Description

The `shell` command decrypts your vault and spawns a new interactive shell session
with all stored environment variables available. When you exit the shell, the
variables are no longer available — they are never written to disk.

This is useful for running commands that require secrets without permanently
exporting them to your environment.

## Example

```bash
$ envault shell
Enter vault password: ****
Spawning shell with 4 vault variable(s) injected.

bash-5.2$ echo $API_KEY
secret123
bash-5.2$ exit
$
```

## Security Notes

- Variables exist only in the spawned shell's memory.
- No variables are written to `.env` files or shell profiles.
- The vault is decrypted in memory and discarded after spawning.
