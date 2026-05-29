import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DependencyHealthService } from './dependency-health.service';
import { RUNTIME_CONFIG } from './runtime-config.provider';
import { validateRuntimeConfig } from '@heimdall/runtime-config';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    DependencyHealthService,
    {
      provide: RUNTIME_CONFIG,
      useFactory: () => validateRuntimeConfig(process.env, 'api'),
    },
  ],
})
export class AppModule {}
