# `envault env` — Inject Vault Variables into Your Shell or Process

The `env` command lets you use your vault entries as environment variables, either by printing shell export statements or by running a command with the variables injected.

## Usage

```bash
# Print export statements (source into your shell)
eval $(envault env)

# Run a command with vault vars in its environment
envault env -- node server.js
envault env -- npm run dev
```

## Options

| Flag | Description |
|------|-------------|
| `--shell` | Run the subprocess via the system shell |

## Examples

### Source variables into your current shell session

```bash
eval $(envault env)
echo $API_KEY
```

### Run a script with vault variables

```bash
envault env -- python scripts/migrate.py
```

### Use with Docker

```bash
envault env -- docker run --env-file /dev/stdin myimage
```

## Notes

- You will be prompted for your vault password.
- Values containing single quotes are safely escaped in export output.
- When running a subprocess, vault variables are merged with your existing environment (`process.env`).
- The command exits with the subprocess exit code on failure.
