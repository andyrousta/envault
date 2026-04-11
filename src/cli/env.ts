import { readVault } from "../vault";
import { promptPassword } from "./get";

/**
 * env command: outputs vault entries as shell export statements or
 * runs a subprocess with the vault entries injected into the environment.
 */
export async function envCommand(
  vaultPath: string,
  args: string[],
  options: { shell?: boolean } = {}
): Promise<void> {
  const password = await promptPassword();

  let entries: Record<string, string>;
  try {
    entries = await readVault(vaultPath, password);
  } catch {
    console.error("Failed to decrypt vault. Wrong password?");
    process.exit(1);
  }

  if (args.length === 0) {
    // Print export statements
    for (const [key, value] of Object.entries(entries)) {
      const escaped = value.replace(/'/g, "'\\''" );
      console.log(`export ${key}='${escaped}'`);
    }
    return;
  }

  // Run subprocess with env vars injected
  const { spawn } = await import("child_process");
  const child = spawn(args[0], args.slice(1), {
    stdio: "inherit",
    env: { ...process.env, ...entries },
    shell: options.shell ?? false,
  });

  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve();
      }
    });
    child.on("error", reject);
  });
}
