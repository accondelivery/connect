import { IntegrationType } from './integration-type.type';

export type IntegrationEventType =
  | 'INTEGRATION_INITIATED'
  | 'INTEGRATION_REQUESTED'
  | 'INTEGRATION_PROCESSING'
  | 'INTEGRATION_COMPLETED'
  | 'INTEGRATION_FAILED'
  | 'INTEGRATION_RETRIED'
  | 'INTEGRATION_CANCELLED';

export interface IntegrationEvent {
  integrationType: IntegrationType;
  eventType: IntegrationEventType;
  externalId?: string;
  description: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
