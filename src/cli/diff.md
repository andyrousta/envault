# `envault diff` — Compare Two Vaults

The `diff` command compares your local vault against another vault file and
highlights any differences between them.

## Usage

```bash
envault diff <other-vault-path>
```

## Arguments

| Argument            | Description                                 |
|---------------------|---------------------------------------------|
| `other-vault-path`  | Path to the other `.envault` vault file     |

## Output Format

Each differing key is printed with a prefix:

| Prefix | Meaning                                  |
|--------|------------------------------------------|
| `+`    | Key exists only in the **other** vault   |
| `-`    | Key exists only in the **local** vault   |
| `~`    | Key exists in both but **values differ** |

If no differences are found, the message `No differences found.` is displayed.

## Example

```bash
$ envault diff /backups/project.envault
Master password: ••••••••
- REMOVED_KEY=old_value  (only in local)
+ NEW_KEY=new_value  (only in other)
~ DATABASE_URL
  local: postgres://localhost/dev
  other: postgres://prod-host/prod
```

## Notes

- Both vaults must be encrypted with the **same master password**.
- The diff is performed in-memory; no changes are written to either vault.
- Keys are displayed in alphabetical order for easy scanning.
