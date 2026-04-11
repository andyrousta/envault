import { Command } from "commander";
import { registerLockCommand } from "./lock";

export function registerLockCommands(program: Command): void {
  registerLockCommand(program);
}
