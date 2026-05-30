import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DependencyHealthService } from './dependency-health.service';
import { LocalAuthController } from './local-auth.controller';
import { LocalAuthService } from './local-auth.service';
import { RUNTIME_CONFIG } from './runtime-config.provider';
import { validateRuntimeConfig } from '@heimdall/runtime-config';

@Module({
  imports: [],
  controllers: [AppController, LocalAuthController],
  providers: [
    AppService,
    DependencyHealthService,
    LocalAuthService,
    {
      provide: RUNTIME_CONFIG,
      useFactory: () => validateRuntimeConfig(process.env, 'api'),
    },
  ],
})
export class AppModule {}
