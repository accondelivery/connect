import { EventsService } from './events.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationEvent } from '../types/integration-event.type';

describe('EventsService', () => {
  let service: EventsService;
  let emitMock: jest.Mock;

  beforeEach(() => {
    emitMock = jest.fn();
    const emitter = { emit: emitMock } as unknown as EventEmitter2;
    service = new EventsService(emitter);
  });

  it('should emit an event with the correct payload using createDispatcherFor', () => {
    const dispatcher = service.createDispatcherFor('test', 'OrderOutput');

    const event: Pick<
      IntegrationEvent,
      'orderId' | 'eventType' | 'externalId' | 'notes' | 'metadata'
    > = {
      orderId: '123',
      eventType: 'INTEGRATION_COMPLETED',
      externalId: 'abc123',
      notes: 'success',
      metadata: { foo: 'bar' },
    };

    dispatcher(event);

    expect(emitMock).toHaveBeenCalledWith(
      'integration:event',
      expect.objectContaining({
        integrationName: 'test',
        integrationType: 'OrderOutput',
        eventType: 'INTEGRATION_COMPLETED',
        externalId: 'abc123',
        notes: 'success',
        metadata: { foo: 'bar' },
        description: 'Integração concluída com sucesso',
        createdAt: expect.any(Date),
      }),
    );
  });
});
