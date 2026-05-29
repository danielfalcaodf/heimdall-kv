import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { toSafeConfigError } from '@heimdall/runtime-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`Application is running on http://localhost:${port}/${globalPrefix}`);
}

bootstrap().catch((error) => {
  Logger.error(toSafeConfigError(error));
  process.exit(1);
});
