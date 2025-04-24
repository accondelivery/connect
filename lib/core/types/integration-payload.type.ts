import { Merchant } from './merchant.type';
import { OrderEvent } from './order-event.type';
import { Order } from './order.type';

export class IntegrationPayload {
  order: Order;
  merchant?: Merchant;
  events?: OrderEvent[];
}
