import { LogSanitizer } from './log-sanitizer';

describe('LogSanitizer', () => {
  let sanitizer: LogSanitizer;

  beforeEach(() => {
    sanitizer = new LogSanitizer();
  });

  it('mascara campo password em objeto', () => {
    const result = sanitizer.sanitize({ email: 'user@test.com', password: 'supersecret' }) as Record<string, unknown>;
    expect(result['password']).toBe('[REDACTED]');
    expect(result['email']).toBe('user@test.com');
  });

  it('mascara campo passwordHash em objeto', () => {
    const result = sanitizer.sanitize({ passwordHash: '$2b$hash' }) as Record<string, unknown>;
    expect(result['passwordHash']).toBe('[REDACTED]');
  });

  it('mascara token em objeto', () => {
    const result = sanitizer.sanitize({ userId: 'u1', token: 'abc123xyz' }) as Record<string, unknown>;
    expect(result['token']).toBe('[REDACTED]');
    expect(result['userId']).toBe('u1');
  });

  it('mascara sessionToken em objeto', () => {
    const result = sanitizer.sanitize({ sessionToken: 'tok-session' }) as Record<string, unknown>;
    expect(result['sessionToken']).toBe('[REDACTED]');
  });

  it('mascara secret em objeto', () => {
    const result = sanitizer.sanitize({ secret: 'mySecret' }) as Record<string, unknown>;
    expect(result['secret']).toBe('[REDACTED]');
  });

  it('mascara campos sensíveis aninhados', () => {
    const result = sanitizer.sanitize({
      user: { id: 'u1', password: 'nested-secret' },
    }) as Record<string, unknown>;
    const user = result['user'] as Record<string, unknown>;
    expect(user['password']).toBe('[REDACTED]');
    expect(user['id']).toBe('u1');
  });

  it('não altera campos não sensíveis', () => {
    const result = sanitizer.sanitize({ action: 'login', result: 'success' }) as Record<string, unknown>;
    expect(result['action']).toBe('login');
    expect(result['result']).toBe('success');
  });

  it('mascara em array de objetos', () => {
    const result = sanitizer.sanitize([
      { email: 'a@test.com', password: 'p1' },
      { email: 'b@test.com', password: 'p2' },
    ]) as Array<Record<string, unknown>>;
    expect(result[0]['password']).toBe('[REDACTED]');
    expect(result[1]['password']).toBe('[REDACTED]');
  });

  it('retorna valores primitivos inalterados', () => {
    expect(sanitizer.sanitize(42)).toBe(42);
    expect(sanitizer.sanitize(true)).toBe(true);
    expect(sanitizer.sanitize(null)).toBeNull();
  });
});
