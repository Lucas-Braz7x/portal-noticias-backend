import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IndexWorkerService } from './modules/articles/infrastructure/indexing/index-worker.service';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  const worker = app.get(IndexWorkerService);
  const logger = new Logger('WorkerBootstrap');

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down index worker`);
    worker.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  await worker.start();
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start index worker', error);
  process.exit(1);
});
