import { IntegrationRegistryService } from './integration-registry.service';
import { IntegrationMeta } from './interfaces/integration-meta.interface';

describe('IntegrationRegistryService', () => {
  const mockMeta1: IntegrationMeta = {
    id: 'test-integration-1',
    type: 'OrderOutput',
    title: 'Test Integration 1',
    category: 'POS',
    logoUrl: '',
    websiteUrl: '',
    description: '',
    configSchema: {} as any,
  };

  const mockMeta2: IntegrationMeta = {
    id: 'test-integration-2',
    type: 'OrderOutput',
    title: 'Test Integration 2',
    category: 'Logistics',
    logoUrl: '',
    websiteUrl: '',
    description: '',
    configSchema: {} as any,
  };

  const mockIntegrationClass1 = class {};
  const mockIntegrationClass2 = class {};

  beforeEach(() => {
    // Reset the internal integrations list before each test
    // @ts-ignore: access private static property for test purposes
    IntegrationRegistryService['integrations'] = [];
  });

  it('should register a new integration', () => {
    IntegrationRegistryService.register(mockMeta1, mockIntegrationClass1);

    const integrations = IntegrationRegistryService.getIntegrations();
    expect(integrations).toHaveLength(1);
    expect(integrations[0]).toEqual({
      meta: mockMeta1,
      integrationClass: mockIntegrationClass1,
    });
  });

  it('should not register a duplicate integration (by meta.id)', () => {
    IntegrationRegistryService.register(mockMeta1, mockIntegrationClass1);
    IntegrationRegistryService.register(mockMeta1, mockIntegrationClass2);

    const integrations = IntegrationRegistryService.getIntegrations();
    expect(integrations).toHaveLength(1);
    expect(integrations[0]).toEqual({
      meta: mockMeta1,
      integrationClass: mockIntegrationClass1,
    });
  });

  it('should register multiple unique integrations', () => {
    IntegrationRegistryService.register(mockMeta1, mockIntegrationClass1);
    IntegrationRegistryService.register(mockMeta2, mockIntegrationClass2);

    const integrations = IntegrationRegistryService.getIntegrations();
    expect(integrations).toHaveLength(2);
    expect(integrations[0].meta.id).toBe('test-integration-1');
    expect(integrations[1].meta.id).toBe('test-integration-2');
  });
});
