import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

const PASSWORD_HASH_PREFIX = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 12;

@Injectable()
export class PasswordService {
  assertPolicy(password: string): void {
    if (
      password.length < MIN_PASSWORD_LENGTH ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      throw new Error('PASSWORD_POLICY_FAILED');
    }
  }

  hash(password: string): string {
    const salt = randomBytes(16).toString('base64url');
    const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('base64url');
    return `${PASSWORD_HASH_PREFIX}$${salt}$${hash}`;
  }

  verify(password: string, passwordHash: string | undefined): boolean {
    if (!passwordHash) return false;
    const [prefix, salt, storedHash] = passwordHash.split('$');
    if (prefix !== PASSWORD_HASH_PREFIX || !salt || !storedHash) return false;
    const actual = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
    const expected = Buffer.from(storedHash, 'base64url');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  hashSecret(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
