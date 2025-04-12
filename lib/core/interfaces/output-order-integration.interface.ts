import { IntegrationEvent } from '../types/integration-event.type';
import { Order } from '../types/order.type';

export interface OutputOrderIntegration<C> {
  onOrderCreated(order: Order, config: C): Promise<void>;
}
