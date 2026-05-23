import { Command } from 'commander';
import { registerSwapCommand } from './swap';

/**
 * Registers the `swap` command alias (`envault xchg`) pointing to the same logic.
 */
export function registerSwapAlias(program: Command): void {
  const alias = new Command('xchg');
  alias.description('Alias for `swap` — exchange values of two keys');
  alias.argument('<keyA>', 'First key');
  alias.argument('<keyB>', 'Second key');
  alias.action(async (keyA: string, keyB: string) => {
    // Delegate to the canonical swap implementation by re-parsing via a sub-program
    const sub = new Command();
    sub.exitOverride();
    registerSwapCommand(sub);
    await sub.parseAsync(['node', 'envault', 'swap', keyA, keyB]);
  });
  program.addCommand(alias);
}
