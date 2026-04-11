import { Command } from 'commander';
import { registerPinCommand } from './pin';
import * as vaultFile from '../vault/vaultFile';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerPinCommand(program);
  return program;
}

const mockVault = {
  entries: [{ key: 'API_KEY', value: 'secret', pinned: false }],
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
  jest.spyOn(vaultFile, 'readVault').mockReturnValue(mockVault as any);
  jest.spyOn(vaultFile, 'writeVault').mockImplementation(() => {});
});

jest.mock('./pin', () => {
  const actual = jest.requireActual('./pin');
  return {
    ...actual,
    prompt: jest.fn().mockResolvedValue('password123'),
  };
});

describe('pin command', () => {
  it('pins a key successfully', async () => {
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'pin', 'API_KEY']);

    expect(vaultFile.writeVault).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ key: 'API_KEY', pinned: true }),
        ]),
      }),
      'password123'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Key "API_KEY" has been pinned.');
    consoleSpy.mockRestore();
  });

  it('unpins a key with --unpin flag', async () => {
    mockVault.entries[0].pinned = true;
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'pin', 'API_KEY', '--unpin']);

    expect(vaultFile.writeVault).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ key: 'API_KEY', pinned: false }),
        ]),
      }),
      'password123'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Key "API_KEY" has been unpinned.');
    consoleSpy.mockRestore();
  });

  it('exits when vault does not exist', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const program = makeProgram();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(program.parseAsync(['node', 'envault', 'pin', 'API_KEY'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('No vault found. Run `envault init` first.');
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
