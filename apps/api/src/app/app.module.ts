import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DependencyHealthService } from './dependency-health.service';
import { LocalAuthController } from './local-auth.controller';
import { ConfigModule } from './modules/config/config.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule, HealthModule, AuthModule],
  controllers: [AppController, LocalAuthController],
  providers: [AppService, DependencyHealthService],
})
export class AppModule {}
