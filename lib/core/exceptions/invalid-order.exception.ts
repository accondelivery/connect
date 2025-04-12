import { Order } from '../types/order.type';

export class InvalidOrderException extends Error {
  constructor(
    message: string,
    private readonly field?: keyof Order,
  ) {
    super(message);
  }
}
