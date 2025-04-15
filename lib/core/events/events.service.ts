import { Injectable } from '@nestjs/common';
import {
  IntegrationEvent,
  IntegrationEventDescriptions,
} from '../types/integration-event.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationEventDispatcher } from '../types/integration-event-dispatcher.type';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmmiter: EventEmitter2) {}

  private dispatch(event: IntegrationEvent): void {
    this.eventEmmiter.emit('integration:event', {
      ...event,
      createdAt: new Date(),
    });
  }

  createDispatcherFor(
    integrationName: string,
    integrationType: IntegrationEvent['integrationType'],
  ): IntegrationEventDispatcher {
    return (
      event: Pick<
        IntegrationEvent,
        'eventType' | 'externalId' | 'notes' | 'metadata'
      >,
    ) => {
      this.dispatch({
        ...event,
        description: IntegrationEventDescriptions[event.eventType],
        integrationName,
        integrationType,
        createdAt: new Date(),
      });
    };
  }
}
