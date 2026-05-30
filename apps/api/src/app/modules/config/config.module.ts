import { Module } from '@nestjs/common';
import { validateRuntimeConfig } from '@heimdall/runtime-config';
import { RUNTIME_CONFIG } from '../../runtime-config.provider';

@Module({
  providers: [
    {
      provide: RUNTIME_CONFIG,
      useFactory: () => validateRuntimeConfig(process.env, 'api'),
    },
  ],
  exports: [RUNTIME_CONFIG],
})
export class ConfigModule {}
