import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { HEALTH_CHECKERS } from './health-checker.interface';
import { DatabaseChecker } from './checkers/database.checker';
import { RedisChecker } from './checkers/redis.checker';
import { WorkerChecker } from './checkers/worker.checker';
import { StorageChecker } from './checkers/storage.checker';
import { JobsChecker } from './checkers/jobs.checker';
import { HealthService } from './health.service';

@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseChecker,
    RedisChecker,
    WorkerChecker,
    StorageChecker,
    JobsChecker,
    {
      provide: HEALTH_CHECKERS,
      useFactory: (db: DatabaseChecker, redis: RedisChecker, worker: WorkerChecker, storage: StorageChecker, jobs: JobsChecker) =>
        [db, redis, worker, storage, jobs],
      inject: [DatabaseChecker, RedisChecker, WorkerChecker, StorageChecker, JobsChecker],
    },
    HealthService,
  ],
  exports: [HealthService],
})
export class HealthModule {}
