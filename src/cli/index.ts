import { Command } from "commander";
import { initVault } from "./init";

const program = new Command();

program
  .name("envault")
  .description("Securely store and sync environment variables using encrypted local vaults")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new vault in the current directory")
  .option("-d, --dir <directory>", "Target directory for the vault", process.cwd())
  .action(async (options: { dir: string }) => {
    try {
      await initVault(options.dir);
    } catch (err) {
      console.error("Failed to initialize vault:", (err as Error).message);
      process.exit(1);
    }
  });

export { program };
