import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { setEntry, getEntry, deleteEntry, listEntries } from './vaultEntry';

const PASSWORD = 'test-password-123';

function tmpVaultPath(): string {
  return path.join(os.tmpdir(), `envault-test-${Date.now()}.vault`);
}

afterEach(() => {
  // cleanup handled per test
});

describe('vaultEntry', () => {
  it('sets and gets an entry', async () => {
    const vp = tmpVaultPath();
    await setEntry(vp, PASSWORD, 'API_KEY', 'secret123');
    const entry = await getEntry(vp, PASSWORD, 'API_KEY');
    expect(entry).toBeDefined();
    expect(entry?.value).toBe('secret123');
    expect(entry?.key).toBe('API_KEY');
    fs.unlinkSync(vp);
  });

  it('preserves createdAt on update', async () => {
    const vp = tmpVaultPath();
    await setEntry(vp, PASSWORD, 'DB_URL', 'postgres://localhost/db');
    const first = await getEntry(vp, PASSWORD, 'DB_URL');
    await new Promise((r) => setTimeout(r, 10));
    await setEntry(vp, PASSWORD, 'DB_URL', 'postgres://remote/db');
    const second = await getEntry(vp, PASSWORD, 'DB_URL');
    expect(second?.createdAt).toBe(first?.createdAt);
    expect(second?.value).toBe('postgres://remote/db');
    fs.unlinkSync(vp);
  });

  it('returns undefined for missing key', async () => {
    const vp = tmpVaultPath();
    await setEntry(vp, PASSWORD, 'EXISTING', 'value');
    const entry = await getEntry(vp, PASSWORD, 'MISSING_KEY');
    expect(entry).toBeUndefined();
    fs.unlinkSync(vp);
  });

  it('deletes an entry', async () => {
    const vp = tmpVaultPath();
    await setEntry(vp, PASSWORD, 'TO_DELETE', 'bye');
    const deleted = await deleteEntry(vp, PASSWORD, 'TO_DELETE');
    expect(deleted).toBe(true);
    const entry = await getEntry(vp, PASSWORD, 'TO_DELETE');
    expect(entry).toBeUndefined();
    fs.unlinkSync(vp);
  });

  it('returns false when deleting non-existent key', async () => {
    const vp = tmpVaultPath();
    await setEntry(vp, PASSWORD, 'SOME_KEY', 'val');
    const deleted = await deleteEntry(vp, PASSWORD, 'GHOST');
    expect(deleted).toBe(false);
    fs.unlinkSync(vp);
  });

  it('lists all entries', async () => {
    const vp = tmpVaultPath();
    await setEntry(vp, PASSWORD, 'KEY_A', 'alpha');
    await setEntry(vp, PASSWORD, 'KEY_B', 'beta');
    await setEntry(vp, PASSWORD, 'KEY_C', 'gamma');
    const entries = await listEntries(vp, PASSWORD);
    expect(entries).toHaveLength(3);
    const keys = entries.map((e) => e.key).sort();
    expect(keys).toEqual(['KEY_A', 'KEY_B', 'KEY_C']);
    fs.unlinkSync(vp);
  });

  it('returns empty list for non-existent vault', async () => {
    const vp = tmpVaultPath();
    const entries = await listEntries(vp, PASSWORD);
    expect(entries).toEqual([]);
  });
});
