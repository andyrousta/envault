# `envault swap`

Swap the values of two keys in the vault.

## Usage

```
envault swap <keyA> <keyB>
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `keyA`   | First key to swap        |
| `keyB`   | Second key to swap       |

## Prompts

- **Password** — The vault master password used to decrypt and re-encrypt the vault.

## Example

```bash
$ envault swap DB_HOST DB_REPLICA_HOST
Password: ****
Swapped values of 'DB_HOST' and 'DB_REPLICA_HOST'.
```

## Notes

- Both keys must exist in the vault.
- Swapping a key with itself is not allowed.
- The vault is re-encrypted after the swap.
