import { Order } from '../types/order.type';

export interface OrderOutputIntegration<C> {
  onOrderCreated(order: Order, config: C): Promise<void>;
}
