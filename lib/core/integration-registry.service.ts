import { Injectable, Logger } from '@nestjs/common';
import { IntegrationMeta } from './interfaces/integration-meta.interface';

@Injectable()
export class IntegrationRegistryService {
  private static integrations: Array<IntegrationMeta> = new Array();

  static register(meta: IntegrationMeta, integrationClass: Function): void {
    const exists = this.integrations.find(({ id }) => id === meta.id);
    if (exists) {
      Logger.warn(
        `Integration already registred: ${meta.id}`,
        IntegrationRegistryService.name,
      );
      return;
    }

    this.integrations.push(meta);
  }
}
