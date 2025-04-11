import { IntegrationEvent } from '../types/integration-event.type';
import { Order } from '../types/order.type';

export interface OutputOrderIntegration {
  onOrderCreated<C>(order: Order, config: C): Promise<IntegrationEvent[]>;
}
