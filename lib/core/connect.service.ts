import { Injectable, Logger, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IntegrationRegistryService } from './integration-registry.service';
import { IntegrationMeta, Order } from '.';
import { loadIntegrationFiles } from './integration-loader';
import * as path from 'node:path';

@Injectable()
export class ConnectService implements OnModuleInit {
  private readonly logger = new Logger(ConnectService.name);

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    await loadIntegrationFiles(path.join(__dirname, '..')); // ../lib
  }

  findAll() {
    return IntegrationRegistryService.getIntegrations();
  }

  async onOrderCreated(
    integrations: Record<string, unknown>,
    payload: { order: Order },
  ) {
    const allIntegrations = this.findAll();

    for (const [integrationId, config] of Object.entries(integrations)) {
      const integrationEntry = allIntegrations.find(
        ({ meta }) => meta.id === integrationId,
      );

      if (!integrationEntry) {
        this.logger.warn(`Integration ${integrationId} not found`);
        continue;
      }

      const { integrationClass } = integrationEntry;

      try {
        const instance = await this.moduleRef.create(
          integrationClass as Type<any>,
        );
        if (typeof instance.onOrderCreated !== 'function') {
          this.logger.warn(
            `Integration ${integrationId} does not implement onOrderCreated`,
          );
          continue;
        }

        await instance.onOrderCreated(payload.order, config);
        this.logger.log(
          `Integration ${integrationId} processed order ${payload.order.id}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to run integration ${integrationId} for order ${payload.order.id}`,
          err.stack,
        );
      }
    }
  }
}
