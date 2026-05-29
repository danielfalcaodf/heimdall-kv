import { ConfigValidationError, validateRuntimeConfig } from '@heimdall/runtime-config';

describe('validateRuntimeConfig', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://app:senha-local@localhost:5432/heimdall_kv',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    STORAGE_PRIVATE_ROOT: '.local/storage/private',
  };

  it('accepts a complete synthetic environment', () => {
    expect(validateRuntimeConfig(validEnv, 'api')).toMatchObject({
      target: 'api',
      redisPort: 6379,
      storagePrivateRoot: '.local/storage/private',
    });
  });

  it('fails clearly without exposing values', () => {
    expect(() =>
      validateRuntimeConfig(
        {
          ...validEnv,
          DATABASE_URL: 'postgresql://user:TROQUE_AQUI@localhost:5432/db',
        },
        'api',
      ),
    ).toThrow(ConfigValidationError);
  });
});
