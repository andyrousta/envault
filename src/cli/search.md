# `envault search <pattern>`

Search for environment variable keys in the vault that match a given pattern.

## Usage

```bash
envault search <pattern>
```

## Description

The `search` command allows you to find keys stored in your vault that match a
given regular expression or substring pattern. The search is **case-insensitive**.

You will be prompted for your vault password before results are displayed.
Only **key names** are searched — values are never shown.

## Arguments

| Argument  | Description                                      |
|-----------|--------------------------------------------------|
| `pattern` | A string or regular expression to match keys against |

## Example

```bash
$ envault search DATABASE
Vault password: ••••••••

Found 2 key(s) matching "DATABASE":

  DATABASE_URL
  DATABASE_HOST
```

```bash
$ envault search ^API
Vault password: ••••••••

Found 2 key(s) matching "^API":

  API_KEY
  API_SECRET
```

## Notes

- The pattern is evaluated as a JavaScript `RegExp` with the `i` (case-insensitive) flag.
- If no keys match, a message is displayed and the command exits cleanly.
- The vault must be initialised before using this command (`envault init`).
