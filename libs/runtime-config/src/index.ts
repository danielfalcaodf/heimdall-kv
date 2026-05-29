export type RuntimeTarget = 'api' | 'worker';

export interface RuntimeConfig {
  target: RuntimeTarget;
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisHost: string;
  redisPort: number;
  storagePrivateRoot: string;
  healthQueueName: string;
}

export class ConfigValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Configuracao invalida: ${issues.join('; ')}`);
    this.name = 'ConfigValidationError';
  }
}

const placeholderFragments = ['troque', 'change_me', 'example_password', 'senha_aqui'];

const requiredKeys = ['DATABASE_URL', 'REDIS_HOST', 'REDIS_PORT', 'STORAGE_PRIVATE_ROOT'] as const;

type RequiredKey = (typeof requiredKeys)[number];

function readRequired(env: NodeJS.ProcessEnv, key: RequiredKey): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new ConfigValidationError([`${key} ausente`]);
  }

  const normalized = value.toLowerCase();
  if (placeholderFragments.some((fragment) => normalized.includes(fragment))) {
    throw new ConfigValidationError([`${key} contem placeholder`]);
  }

  return value;
}

function readPort(value: string | undefined, fallback: number, key: string): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new ConfigValidationError([`${key} invalido`]);
  }

  return parsed;
}

export function validateRuntimeConfig(
  env: NodeJS.ProcessEnv,
  target: RuntimeTarget,
): RuntimeConfig {
  const issues: string[] = [];
  const values = new Map<RequiredKey, string>();

  for (const key of requiredKeys) {
    try {
      values.set(key, readRequired(env, key));
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        issues.push(...error.issues);
      } else {
        throw error;
      }
    }
  }

  let redisPort = 0;
  let port = 0;

  try {
    redisPort = readPort(env.REDIS_PORT, 6379, 'REDIS_PORT');
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      issues.push(...error.issues);
    } else {
      throw error;
    }
  }

  try {
    port = readPort(env.PORT, target === 'api' ? 3001 : 3002, 'PORT');
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      issues.push(...error.issues);
    } else {
      throw error;
    }
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  return {
    target,
    nodeEnv: env.NODE_ENV || 'development',
    port,
    databaseUrl: values.get('DATABASE_URL') as string,
    redisHost: values.get('REDIS_HOST') as string,
    redisPort,
    storagePrivateRoot: values.get('STORAGE_PRIVATE_ROOT') as string,
    healthQueueName: env.HEALTH_QUEUE_NAME || 'system.health.sanity',
  };
}

export function toSafeConfigError(error: unknown): string {
  if (error instanceof ConfigValidationError) {
    return error.issues.join('; ');
  }

  return 'Configuracao invalida';
}
