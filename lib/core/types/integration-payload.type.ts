import { Merchant } from './merchant.type';
import { Order } from './order.type';

export class IntegrationPayload {
  order: Order;
  merchant?: Merchant;
}
