export type RuntimeTarget = 'api' | 'worker';

// ─── Domain sub-interfaces (ISP) ──────────────────────────────────────────────

export interface ServerConfig {
  port: number;
  nodeEnv: string;
}

export interface DbConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  queueName: string;
}

export interface StorageConfig {
  privateRoot: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

// ─── Composed RuntimeConfig ───────────────────────────────────────────────────

export interface RuntimeConfig {
  target: RuntimeTarget;
  server: ServerConfig;
  db: DbConfig;
  redis: RedisConfig;
  storage: StorageConfig;
  auth?: AuthConfig;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

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

function readRequiredSecret(env: NodeJS.ProcessEnv, key: string): string {
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

function collect<T>(
  fn: () => T,
  issues: string[],
): T | undefined {
  try {
    return fn();
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      issues.push(...error.issues);
    } else {
      throw error;
    }
    return undefined;
  }
}

// ─── Main validator ───────────────────────────────────────────────────────────

export function validateRuntimeConfig(
  env: NodeJS.ProcessEnv,
  target: RuntimeTarget,
): RuntimeConfig {
  const issues: string[] = [];
  const values = new Map<RequiredKey, string>();

  for (const key of requiredKeys) {
    const value = collect(() => readRequired(env, key), issues);
    if (value !== undefined) {
      values.set(key, value);
    }
  }

  const redisPort = collect(() => readPort(env.REDIS_PORT, 6379, 'REDIS_PORT'), issues) ?? 0;
  const port = collect(
    () => readPort(env.PORT, target === 'api' ? 3001 : 3002, 'PORT'),
    issues,
  ) ?? 0;

  let auth: AuthConfig | undefined;
  if (target === 'api') {
    const jwtSecret = collect(() => readRequiredSecret(env, 'JWT_SECRET'), issues);
    if (jwtSecret !== undefined) {
      auth = {
        jwtSecret,
        jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
      };
    }
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  return {
    target,
    server: {
      port,
      nodeEnv: env.NODE_ENV || 'development',
    },
    db: {
      url: values.get('DATABASE_URL') as string,
    },
    redis: {
      host: values.get('REDIS_HOST') as string,
      port: redisPort,
      queueName: env.HEALTH_QUEUE_NAME || 'system.health.sanity',
    },
    storage: {
      privateRoot: values.get('STORAGE_PRIVATE_ROOT') as string,
    },
    auth,
  };
}

export function toSafeConfigError(error: unknown): string {
  if (error instanceof ConfigValidationError) {
    return error.issues.join('; ');
  }

  return 'Configuracao invalida';
}
