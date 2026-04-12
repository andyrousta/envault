# `envault alias` — Key Aliases

The `alias` command lets you define short, memorable names for vault keys.
This is useful when key names are long or hard to remember.

## Commands

### `envault alias set <alias> <key>`

Create a new alias pointing to an existing vault key.

```bash
envault alias set mydb DATABASE_URL
envault alias set apikey STRIPE_SECRET_KEY
```

### `envault alias remove <alias>`

Delete an alias by name.

```bash
envault alias remove mydb
```

### `envault alias list`

Print all defined aliases and their target keys.

```bash
envault alias list
# mydb -> DATABASE_URL
# apikey -> STRIPE_SECRET_KEY
```

### `envault alias resolve <alias>`

Print the key name that an alias points to.

```bash
envault alias resolve mydb
# DATABASE_URL
```

## Alias Storage

Aliases are stored in `~/.envault_aliases.json` as a plain JSON map.
They are **not** encrypted and do not contain secret values — only key names.

## Notes

- Aliases are global across all vaults.
- Deleting an alias does not delete the underlying vault entry.
- Use aliases with other commands by resolving them first:
  ```bash
  envault get $(envault alias resolve mydb)
  ```
