import { Injectable } from '@nestjs/common';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'tokenHash',
  'sessionToken',
  'secret',
  'authorization',
  'cookie',
]);

const MASK = '[REDACTED]';

@Injectable()
export class LogSanitizer {
  sanitize(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string') return this.sanitizeString(data);
    if (Array.isArray(data)) return data.map((item) => this.sanitize(item));
    if (typeof data === 'object') return this.sanitizeObject(data as Record<string, unknown>);
    return data;
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase()) ? MASK : this.sanitize(value);
    }
    return result;
  }

  private sanitizeString(value: string): string {
    return value
      .replace(/("password"\s*:\s*)"[^"]*"/gi, `$1"${MASK}"`)
      .replace(/("token"\s*:\s*)"[^"]*"/gi, `$1"${MASK}"`)
      .replace(/("secret"\s*:\s*)"[^"]*"/gi, `$1"${MASK}"`);
  }
}
