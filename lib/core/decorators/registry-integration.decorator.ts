import 'reflect-metadata';
import { IntegrationRegistryService } from '../integration-registry.service';
import { IntegrationMeta } from '../interfaces/integration-meta.interface';

export function RegistryIntegration(meta: IntegrationMeta): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata('integration:meta', meta, target);
    IntegrationRegistryService.register(meta, target);
  };
}
