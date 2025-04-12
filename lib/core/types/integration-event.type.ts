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
  integrationName: string;
  integrationType: IntegrationType;
  eventType: IntegrationEventType;
  externalId?: string;
  description: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export const IntegrationEventDescriptions: Record<
  IntegrationEventType,
  string
> = {
  INTEGRATION_INITIATED: 'Integração iniciada',
  INTEGRATION_REQUESTED: 'Solicitação enviada para o sistema integrado',
  INTEGRATION_PROCESSING: 'Processamento da integração em andamento',
  INTEGRATION_COMPLETED: 'Integração concluída com sucesso',
  INTEGRATION_FAILED: 'Falha na integração',
  INTEGRATION_RETRIED: 'Tentativa de nova integração',
  INTEGRATION_CANCELLED: 'Integração cancelada',
};
