import { ConfigValidationError, validateRuntimeConfig } from '@heimdall/runtime-config';

const validApiEnv: NodeJS.ProcessEnv = {
  DATABASE_URL: 'postgresql://app:s3cur3p4ss@localhost:5432/heimdall_kv',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  STORAGE_PRIVATE_ROOT: '.local/storage/private',
  JWT_SECRET: 'super_secret_key_for_tests_min_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxx',
  JWT_EXPIRES_IN: '7d',
  PORT: '3001',
  NODE_ENV: 'development',
  HEALTH_QUEUE_NAME: 'system.health.sanity',
};

const validWorkerEnv: NodeJS.ProcessEnv = {
  DATABASE_URL: 'postgresql://app:s3cur3p4ss@localhost:5432/heimdall_kv',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  STORAGE_PRIVATE_ROOT: '.local/storage/private',
  PORT: '3002',
  NODE_ENV: 'development',
};

describe('validateRuntimeConfig', () => {
  describe('api target — nested shape', () => {
    it('returns nested domain config for valid api env', () => {
      const config = validateRuntimeConfig(validApiEnv, 'api');
      expect(config.target).toBe('api');
      expect(config.server).toEqual({ port: 3001, nodeEnv: 'development' });
      expect(config.db).toEqual({ url: validApiEnv.DATABASE_URL });
      expect(config.redis).toEqual({ host: 'localhost', port: 6379, queueName: 'system.health.sanity' });
      expect(config.storage).toEqual({ privateRoot: '.local/storage/private' });
      expect(config.auth).toEqual({
        jwtSecret: validApiEnv.JWT_SECRET,
        jwtExpiresIn: '7d',
      });
    });

    it('throws when JWT_SECRET is missing for api', () => {
      const env = { ...validApiEnv };
      delete env.JWT_SECRET;
      expect(() => validateRuntimeConfig(env, 'api')).toThrow(ConfigValidationError);
    });

    it('throws when JWT_SECRET contains placeholder for api', () => {
      expect(() =>
        validateRuntimeConfig({ ...validApiEnv, JWT_SECRET: 'TROQUE_POR_CHAVE_SEGURA' }, 'api'),
      ).toThrow(ConfigValidationError);
    });

    it('throws when DATABASE_URL contains placeholder', () => {
      expect(() =>
        validateRuntimeConfig(
          { ...validApiEnv, DATABASE_URL: 'postgresql://user:TROQUE_AQUI@localhost:5432/db' },
          'api',
        ),
      ).toThrow(ConfigValidationError);
    });

    it('throws when REDIS_PORT is out of range', () => {
      expect(() =>
        validateRuntimeConfig({ ...validApiEnv, REDIS_PORT: '99999' }, 'api'),
      ).toThrow(ConfigValidationError);
    });

    it('uses defaults for optional vars', () => {
      const env = { ...validApiEnv };
      delete env.HEALTH_QUEUE_NAME;
      delete env.NODE_ENV;
      delete env.PORT;
      const config = validateRuntimeConfig(env, 'api');
      expect(config.redis.queueName).toBe('system.health.sanity');
      expect(config.server.nodeEnv).toBe('development');
      expect(config.server.port).toBe(3001);
    });
  });

  describe('worker target', () => {
    it('returns nested config without auth for valid worker env', () => {
      const config = validateRuntimeConfig(validWorkerEnv, 'worker');
      expect(config.target).toBe('worker');
      expect(config.server.port).toBe(3002);
      expect(config.auth).toBeUndefined();
    });

    it('does NOT throw when JWT_SECRET is missing for worker', () => {
      expect(() => validateRuntimeConfig(validWorkerEnv, 'worker')).not.toThrow();
    });
  });

  describe('error accumulation', () => {
    it('accumulates multiple missing fields in a single throw', () => {
      expect(() =>
        validateRuntimeConfig(
          { REDIS_HOST: 'localhost', REDIS_PORT: '6379', JWT_SECRET: 'ok' },
          'api',
        ),
      ).toThrow(ConfigValidationError);
    });
  });
});
