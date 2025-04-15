import { Test, TestingModule } from '@nestjs/testing';
import { ConnectService } from './connect.service';
import { ModuleRef } from '@nestjs/core';
import { IntegrationRegistryService } from './integration-registry.service';
import { IntegrationMeta, Order } from '.';

jest.mock('./integration-loader', () => ({
  loadIntegrationFiles: jest.fn(),
}));

describe('ConnectService', () => {
  let service: ConnectService;
  let moduleRef: ModuleRef;

  const mockLogger = {
    warn: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockOrder: Order = { id: 'order123' } as Order;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectService,
        {
          provide: ModuleRef,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ConnectService);
    moduleRef = module.get(ModuleRef);

    // Override private logger
    Object.assign(service, { logger: mockLogger });

    // Clear registry before each test
    (IntegrationRegistryService as any)._integrations = [];
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should call loadIntegrationFiles on init', async () => {
    const { loadIntegrationFiles } = await import('./integration-loader');
    await service.onModuleInit();
    expect(loadIntegrationFiles).toHaveBeenCalled();
  });

  it('should skip unknown integration', async () => {
    await service.onOrderCreated({ unknown: {} }, { order: mockOrder });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Integration unknown not found',
    );
  });

  it('should skip integration without onOrderCreated method', async () => {
    class NoopIntegration {}
    IntegrationRegistryService.register(
      { id: 'test' } as unknown as IntegrationMeta,
      NoopIntegration,
    );

    jest.spyOn(moduleRef, 'create').mockResolvedValue(new NoopIntegration());

    await service.onOrderCreated({ test: {} }, { order: mockOrder });

    expect(moduleRef.create).toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Integration test does not implement onOrderCreated',
    );
  });

  it('should execute integration successfully', async () => {
    const handler = {
      onOrderCreated: jest.fn(),
    };

    class Integration {
      onOrderCreated(order: Order, token: any) {
        return Promise.resolve();
      }
    }
    IntegrationRegistryService.register(
      { id: 'exec' } as unknown as IntegrationMeta,
      Integration,
    );
    jest.spyOn(moduleRef, 'create').mockResolvedValue(handler);

    await service.onOrderCreated(
      { exec: { token: 'abc' } },
      { order: mockOrder },
    );
    expect(handler.onOrderCreated).toHaveBeenCalledWith(mockOrder, {
      token: 'abc',
    });
    expect(mockLogger.log).toHaveBeenCalledWith(
      'Integration exec processed order order123',
    );
  });

  it('should catch and log error thrown by integration', async () => {
    class BadIntegration {
      onOrderCreated() {
        throw new Error('boom');
      }
    }

    IntegrationRegistryService.register(
      { id: 'bad' } as unknown as IntegrationMeta,
      BadIntegration,
    );
    jest.spyOn(moduleRef, 'create').mockResolvedValue(new BadIntegration());

    await service.onOrderCreated({ bad: {} }, { order: mockOrder });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to run integration bad for order order123',
      expect.any(String),
    );
  });

  it('should handle error when integration fails', async () => {
    class FailingIntegration {
      onOrderCreated() {
        return Promise.reject(new Error('integration error'));
      }
    }

    IntegrationRegistryService.register(
      { id: 'failing' } as unknown as IntegrationMeta,
      FailingIntegration,
    );
    jest.spyOn(moduleRef, 'create').mockResolvedValue(new FailingIntegration());

    await service.onOrderCreated({ failing: {} }, { order: mockOrder });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to run integration failing for order order123',
      expect.any(String),
    );
  });
});
