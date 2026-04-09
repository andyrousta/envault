#!/usr/bin/env node
import { program } from "./index";

program.parseAsync(process.argv).catch((err: Error) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
