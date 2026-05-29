import type { RuntimeConfig } from '@heimdall/runtime-config';

export const RUNTIME_CONFIG = Symbol('RUNTIME_CONFIG');

export type RuntimeConfigProvider = RuntimeConfig;
