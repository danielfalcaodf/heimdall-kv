import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { basename, join, normalize, relative } from 'node:path';

export interface PrivateStorageObject {
  key: string;
  contentType: string;
  size: number;
  checksum: string;
  visibility: 'private';
}

export interface PutPrivateObjectInput {
  scope: string;
  filename: string;
  contentType: string;
  body: Buffer;
}

export interface PrivateStorageAdapter {
  putObject(input: PutPrivateObjectInput): Promise<PrivateStorageObject>;
  getObject(key: string): Promise<Buffer>;
  healthCheck(): Promise<boolean>;
}

function sanitizeSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return cleaned.length > 0 ? cleaned : 'object';
}

function resolveInsideRoot(root: string, key: string): string {
  const fullPath = normalize(join(root, key));
  const pathDelta = relative(root, fullPath);

  if (pathDelta.startsWith('..') || pathDelta === '') {
    throw new Error('Chave de storage invalida');
  }

  return fullPath;
}

export class LocalPrivateStorageAdapter implements PrivateStorageAdapter {
  constructor(private readonly root: string) {}

  async putObject(input: PutPrivateObjectInput): Promise<PrivateStorageObject> {
    const scope = sanitizeSegment(input.scope);
    const filename = sanitizeSegment(basename(input.filename));
    const key = `${scope}/${randomUUID()}-${filename}`;
    const objectPath = resolveInsideRoot(this.root, key);
    const checksum = createHash('sha256').update(input.body).digest('hex');

    await fs.mkdir(join(this.root, scope), { recursive: true });
    await fs.writeFile(objectPath, input.body);

    return {
      key,
      contentType: input.contentType,
      size: input.body.byteLength,
      checksum,
      visibility: 'private',
    };
  }

  async getObject(key: string): Promise<Buffer> {
    return fs.readFile(resolveInsideRoot(this.root, key));
  }

  async healthCheck(): Promise<boolean> {
    await fs.mkdir(this.root, { recursive: true });
    await fs.access(this.root);
    return true;
  }
}
