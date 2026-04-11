#!/usr/bin/env node
import { program } from "./index";

program.parseAsync(process.argv).catch((err: Error) => {
  if (process.env.DEBUG) {
    console.error("Unexpected error:", err);
  } else {
    console.error("Unexpected error:", err.message);
  }
  process.exit(1);
});
