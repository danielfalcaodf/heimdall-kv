import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkerQueueService } from './worker-queue.service';
import { RUNTIME_CONFIG } from './runtime-config.provider';
import { validateRuntimeConfig } from '@heimdall/runtime-config';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    WorkerQueueService,
    {
      provide: RUNTIME_CONFIG,
      useFactory: () => validateRuntimeConfig(process.env, 'worker'),
    },
  ],
})
export class AppModule {}
