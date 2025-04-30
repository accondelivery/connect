import { Injectable, Logger, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IntegrationRegistryService } from './integration-registry.service';
import { IntegrationMeta, IntegrationPayload } from '.';
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

  findOne(integrationId: string) {
    return IntegrationRegistryService.getIntegrations().find(
      ({ meta }) => meta.id === integrationId,
    );
  }

  /**
   * @deprecated This method is retained only for backward compatibility with the old integration interface.
   * Use onOrderEvent('onOrderCreated', ...) instead.
   */
  onOrderCreated(
    integrations: Record<string, unknown>,
    payload: IntegrationPayload,
  ) {
    return this.onOrderEvent('onOrderCreated', integrations, payload);
  }

  async onOrderEvent(
    event: 'onOrderCreated' | 'onOrderUpdated' | 'onOrderCanceled',
    integrations: Record<string, unknown>,
    payload: IntegrationPayload,
  ) {
    const allIntegrations = this.findAll();

    for (const [integrationId, config] of Object.entries(integrations)) {
      const integrationEntry = allIntegrations.find(
        ({ meta }) => meta.id === integrationId,
      );

      if (!integrationEntry) {
        this.logger.error(
          `${event}: integration with ID '${integrationId}' was not found.`,
        );
        continue;
      }

      const { integrationClass } = integrationEntry;

      try {
        const instance = await this.moduleRef.create(
          integrationClass as Type<any>,
        );
        if (typeof instance[event] !== 'function') {
          this.logger.error(
            `${event}: integration with ID '${integrationId}' does not implement '${event}'.`,
          );
          continue;
        }

        await instance[event](payload, config);
        this.logger.log(
          `${event}: integration with ID '${integrationId}' successfully processed order '${payload.order.id}'.`,
        );
      } catch (err) {
        this.logger.error(
          `${event}: an error occurred while executing integration '${integrationId}' for order '${payload.order.id}'.`,
          err.stack,
        );
      }
    }
  }

  async onWebhookData(integrationId: string, body: any, queryParams?: any) {
    const integration = this.findOne(integrationId);
    if (!integration) {
      this.logger.error(
        `onWebhookData: integration with ID '${integrationId}' was not found.`,
      );
      return;
    }

    const { integrationClass } = integration;

    try {
      const instance = await this.moduleRef.create(
        integrationClass as Type<any>,
      );
      if (typeof instance.onWebhookData !== 'function') {
        this.logger.error(
          `onWebhookData: integration with ID '${integrationId}' does not implement 'onWebhookData'.`,
        );
      }
      await instance.onWebhookData(body, queryParams);
    } catch (err) {
      this.logger.error(`onWebhookData: ${err.message}`, err.stack);
    }
  }
}
