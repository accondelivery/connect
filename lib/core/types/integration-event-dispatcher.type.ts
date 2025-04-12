import { IntegrationEvent } from './integration-event.type';

export type IntegrationEventDispatcher = (
  event: Pick<
    IntegrationEvent,
    'eventType' | 'externalId' | 'notes' | 'metadata'
  >,
) => void;
