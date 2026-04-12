import * as fs from "fs";
import * as zlib from "zlib";
import * as path from "path";
import { Command } from "commander";
import { vaultPath, vaultExists } from "../vault/vaultFile";

export function registerCompressCommand(program: Command): void {
  program
    .command("compress")
    .description("Compress the vault file to reduce disk usage")
    .option("-o, --output <path>", "Output path for compressed file")
    .option("--decompress", "Decompress a previously compressed vault file")
    .action(async (options) => {
      const source = vaultPath();

      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      if (options.decompress) {
        const inputPath = options.output ?? source + ".gz";
        if (!fs.existsSync(inputPath)) {
          console.error(`Compressed file not found: ${inputPath}`);
          process.exit(1);
        }
        const compressed = fs.readFileSync(inputPath);
        const decompressed = zlib.gunzipSync(compressed);
        fs.writeFileSync(source, decompressed);
        console.log(`Vault decompressed from ${path.relative(process.cwd(), inputPath)}`);
        return;
      }

      const outputPath = options.output ?? source + ".gz";
      const raw = fs.readFileSync(source);
      const compressed = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
      fs.writeFileSync(outputPath, compressed);

      const originalSize = raw.length;
      const compressedSize = compressed.length;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      console.log(`Vault compressed to ${path.relative(process.cwd(), outputPath)}`);
      console.log(`Original: ${originalSize} bytes → Compressed: ${compressedSize} bytes (${ratio}% reduction)`);
    });
}
