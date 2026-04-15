import { Command } from 'commander';
import * as vaultFile from '../vault/vaultFile';
import * as vaultEntry from '../vault/vaultEntry';
import { registerRekeyCommand } from './rekey';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerRekeyCommand(program);
  return program;
}

const VAULT_PATH = '/tmp/test-rekey.vault';

describe('rekey command', () => {
  let promptMock: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    promptMock = jest.spyOn(require('./rekey'), 'promptPassword');
  });

  it('exits with error if vault does not exist', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'rekey', '-p', VAULT_PATH])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error if current password is wrong', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    jest.spyOn(vaultFile, 'readVault').mockRejectedValue(new Error('decrypt failed'));
    promptMock.mockResolvedValueOnce('wrongpass');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'rekey', '-p', VAULT_PATH])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error if new passwords do not match', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    jest.spyOn(vaultFile, 'readVault').mockResolvedValue({ KEY: 'value' });
    promptMock
      .mockResolvedValueOnce('oldpassword')
      .mockResolvedValueOnce('newpassword1')
      .mockResolvedValueOnce('newpassword2');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'rekey', '-p', VAULT_PATH])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error if new password is too short', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    jest.spyOn(vaultFile, 'readVault').mockResolvedValue({ KEY: 'value' });
    promptMock
      .mockResolvedValueOnce('oldpassword')
      .mockResolvedValueOnce('short')
      .mockResolvedValueOnce('short');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = makeProgram();
    await expect(program.parseAsync(['node', 'envault', 'rekey', '-p', VAULT_PATH])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('re-encrypts vault with new password on success', async () => {
    jest.spyOn(vaultFile, 'vaultExists').mockReturnValue(true);
    const readVaultMock = jest.spyOn(vaultFile, 'readVault').mockResolvedValue({ KEY: 'value' });
    const writeVaultMock = jest.spyOn(vaultFile, 'writeVault').mockResolvedValue(undefined);
    promptMock
      .mockResolvedValueOnce('oldpassword')
      .mockResolvedValueOnce('newpassword')
      .mockResolvedValueOnce('newpassword');

    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'rekey', '-p', VAULT_PATH]);

    expect(readVaultMock).toHaveBeenCalledWith(VAULT_PATH, 'oldpassword');
    expect(writeVaultMock).toHaveBeenCalledWith(VAULT_PATH, 'newpassword', { KEY: 'value' });
  });
});
