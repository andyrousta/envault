import { jest } from '@jest/globals';
import { tagCommand } from './tag';
import * as vaultModule from '../vault';

const mockReadline = { question: jest.fn(), close: jest.fn() };
jest.mock('readline', () => ({
  createInterface: () => ({
    question: (q: string, cb: (a: string) => void) => { cb('testpass'); mockReadline.close(); },
    close: mockReadline.close,
  }),
}));

describe('tagCommand', () => {
  const vaultDir = '/tmp/test-vault';

  beforeEach(() => {
    jest.spyOn(vaultModule, 'vaultExists').mockReturnValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('adds a tag to an existing key', async () => {
    jest.spyOn(vaultModule, 'readVault').mockResolvedValue({ MY_KEY: { value: 'abc' } } as any);
    const writeSpy = jest.spyOn(vaultModule, 'writeVault').mockResolvedValue(undefined as any);

    await tagCommand('MY_KEY', 'production', { vault: vaultDir });

    expect(writeSpy).toHaveBeenCalledWith(
      vaultDir,
      'testpass',
      expect.objectContaining({ MY_KEY: { value: 'abc', tags: ['production'] } })
    );
  });

  it('removes a tag from a key', async () => {
    jest.spyOn(vaultModule, 'readVault').mockResolvedValue({
      MY_KEY: { value: 'abc', tags: ['production', 'staging'] },
    } as any);
    const writeSpy = jest.spyOn(vaultModule, 'writeVault').mockResolvedValue(undefined as any);

    await tagCommand('MY_KEY', 'staging', { vault: vaultDir, remove: true });

    expect(writeSpy).toHaveBeenCalledWith(
      vaultDir,
      'testpass',
      expect.objectContaining({ MY_KEY: { value: 'abc', tags: ['production'] } })
    );
  });

  it('exits if vault does not exist', async () => {
    jest.spyOn(vaultModule, 'vaultExists').mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(tagCommand('KEY', 'tag', { vault: vaultDir })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits if key does not exist in vault', async () => {
    jest.spyOn(vaultModule, 'readVault').mockResolvedValue({} as any);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(tagCommand('MISSING', 'tag', { vault: vaultDir })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
