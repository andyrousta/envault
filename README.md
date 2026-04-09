# envault

> A CLI tool for securely storing and syncing environment variables across projects using encrypted local vaults.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize a new vault in your project:

```bash
envault init
```

Add an environment variable:

```bash
envault set API_KEY "your-secret-key"
```

Retrieve a variable:

```bash
envault get API_KEY
```

Export all variables to a `.env` file:

```bash
envault export > .env
```

Sync your vault across projects:

```bash
envault sync --project my-app
```

---

## How It Works

`envault` stores your environment variables in an AES-256 encrypted local vault file (`.envault`). Each vault is protected by a master password and can be shared or synced across multiple projects without exposing sensitive values in plaintext.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)