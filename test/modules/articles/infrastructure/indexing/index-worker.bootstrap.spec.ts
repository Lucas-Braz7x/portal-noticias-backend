import { ConfigService } from '@nestjs/config';
import { IndexWorkerBootstrap } from '@/modules/articles/infrastructure/indexing/index-worker.bootstrap';
import { IndexWorkerService } from '@/modules/articles/infrastructure/indexing/index-worker.service';

describe('IndexWorkerBootstrap', () => {
  let worker: jest.Mocked<Pick<IndexWorkerService, 'start' | 'stop'>>;
  let config: jest.Mocked<ConfigService>;
  let bootstrap: IndexWorkerBootstrap;

  beforeEach(() => {
    worker = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
    };

    config = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    bootstrap = new IndexWorkerBootstrap(
      worker as unknown as IndexWorkerService,
      config,
    );
  });

  it('starts embedded worker when async indexing is enabled', () => {
    config.get.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === 'INDEXING_MODE') return 'async';
      if (key === 'INDEX_WORKER_AUTOSTART') return 'true';
      return defaultValue;
    });

    bootstrap.onModuleInit();

    expect(worker.start).toHaveBeenCalledTimes(1);
  });

  it('does not start worker in sync mode', () => {
    config.get.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === 'INDEXING_MODE') return 'sync';
      return defaultValue;
    });

    bootstrap.onModuleInit();

    expect(worker.start).not.toHaveBeenCalled();
  });

  it('stops worker on destroy when autostarted', () => {
    config.get.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === 'INDEXING_MODE') return 'async';
      if (key === 'INDEX_WORKER_AUTOSTART') return 'true';
      return defaultValue;
    });

    bootstrap.onModuleInit();
    bootstrap.onModuleDestroy();

    expect(worker.stop).toHaveBeenCalledTimes(1);
  });
});
