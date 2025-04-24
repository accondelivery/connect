export enum OrderEventType {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKUP_AREA_ASSIGNED = 'PICKUP_AREA_ASSIGNED',
  DELIVERED = 'DELIVERED',
  CONCLUDED = 'CONCLUDED',
  CANCELLATION_REQUESTED = 'CANCELLATION_REQUESTED',
  CANCELLATION_REQUEST_DENIED = 'CANCELLATION_REQUEST_DENIED',
  CANCELLED = 'CANCELLED',
  ORDER_CANCELLATION_REQUEST = 'ORDER_CANCELLATION_REQUEST',
  CANCELLED_DENIED = 'CANCELLED_DENIED',
}

export class OrderEvent {
  id: number;
  publicId: string;
  externalId: string | null;
  eventType: OrderEventType;
  orderEventCategory: 'OPEN_DELIVERY' | 'ONLINE_PAYMENT';
  orderId: number;
  sourceAppId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
