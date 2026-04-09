import { describe, it, expect } from 'vitest';
import { buildCli } from './index';

describe('buildCli', () => {
  it('registers all expected commands', () => {
    const program = buildCli();
    const commandNames = program.commands.map((c) => c.name());

    expect(commandNames).toContain('init');
    expect(commandNames).toContain('set');
    expect(commandNames).toContain('get');
    expect(commandNames).toContain('list');
    expect(commandNames).toContain('delete');
    expect(commandNames).toContain('export');
    expect(commandNames).toContain('import');
    expect(commandNames).toContain('copy');
    expect(commandNames).toContain('rotate');
  });

  it('has correct program name', () => {
    const program = buildCli();
    expect(program.name()).toBe('envault');
  });

  it('rotate command has correct description', () => {
    const program = buildCli();
    const rotateCmd = program.commands.find((c) => c.name() === 'rotate');
    expect(rotateCmd).toBeDefined();
    expect(rotateCmd?.description()).toContain('Rotate');
  });

  it('set command accepts a key argument', () => {
    const program = buildCli();
    const setCmd = program.commands.find((c) => c.name() === 'set');
    expect(setCmd).toBeDefined();
    const args = setCmd?.registeredArguments ?? [];
    expect(args.some((a) => a.name() === 'key')).toBe(true);
  });

  it('copy command accepts key and dest arguments', () => {
    const program = buildCli();
    const copyCmd = program.commands.find((c) => c.name() === 'copy');
    expect(copyCmd).toBeDefined();
    const argNames = (copyCmd?.registeredArguments ?? []).map((a) => a.name());
    expect(argNames).toContain('key');
    expect(argNames).toContain('dest');
  });
});
