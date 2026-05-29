import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LocalPrivateStorageAdapter } from '@heimdall/storage';

describe('LocalPrivateStorageAdapter', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'heimdall-storage-'));
  });

  afterEach(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it('stores private objects with sanitized keys', async () => {
    const adapter = new LocalPrivateStorageAdapter(root);
    const stored = await adapter.putObject({
      scope: 'cliente demo',
      filename: '../manual.pdf',
      contentType: 'application/pdf',
      body: Buffer.from('synthetic-content'),
    });

    expect(stored.visibility).toBe('private');
    expect(stored.key).not.toContain('..');
    await expect(adapter.getObject(stored.key)).resolves.toEqual(Buffer.from('synthetic-content'));
  });
});
