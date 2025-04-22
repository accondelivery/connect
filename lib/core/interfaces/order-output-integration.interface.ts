import { Order } from '../types/order.type';

export interface OrderOutputIntegration<C> {
  onOrderCreated(order: Order, config: C): Promise<void>;
  onOrderUpdated?(order: Order, config: C): Promise<void>;
  onOrderCanceled?(order: Order, config: C): Promise<void>;
}
