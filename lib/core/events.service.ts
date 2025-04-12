import { Injectable } from '@nestjs/common';
import {
  IntegrationEvent,
  IntegrationEventType,
} from './types/integration-event.type';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmmiter: EventEmitter2) {}

  dispatch(event: IntegrationEvent): void {
    this.eventEmmiter.emit('integration:event', {
      ...event,
      createdAt: new Date(),
    });
  }
}
