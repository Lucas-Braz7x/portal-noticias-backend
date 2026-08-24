import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  isAsyncIndexing,
  isWorkerAutostartEnabled,
} from '../../../../shared/config/indexing.config';
import { IndexWorkerService } from './index-worker.service';

@Injectable()
export class IndexWorkerBootstrap implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexWorkerBootstrap.name);
  private autostarted = false;

  constructor(
    private readonly worker: IndexWorkerService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (
      !isAsyncIndexing(this.config) ||
      !isWorkerAutostartEnabled(this.config)
    ) {
      return;
    }

    this.autostarted = true;
    this.logger.log('Starting embedded index worker (INDEXING_MODE=async)');

    void this.worker.start().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Unknown worker error';
      this.logger.error(`Embedded index worker failed: ${message}`);
    });
  }

  onModuleDestroy(): void {
    if (!this.autostarted) {
      return;
    }

    this.worker.stop();
  }
}
