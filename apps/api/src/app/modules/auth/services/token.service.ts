import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenService {
  createOpaque(prefix: string): string {
    return `${prefix}_${randomBytes(32).toString('base64url')}`;
  }
}
