import { IntegrationEvent } from './integration-event.type';

export type IntegrationEventDispatcher = (
  event: Pick<
    IntegrationEvent,
    'orderId' | 'eventType' | 'externalId' | 'notes' | 'metadata'
  >,
) => void;
