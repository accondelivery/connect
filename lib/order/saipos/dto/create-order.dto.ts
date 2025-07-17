export class DeliveryAddressDto {
  country: 'BR';
  state: string;
  city: string;
  district: string;
  street_name: string;
  street_number: string;
  postal_code: string;
  reference?: string;
  complement?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export type PaymentTypeCode =
  | 'CRE'
  | 'CARD'
  | 'DEB'
  | 'DIN'
  | 'PARTNER_PAYMENT'
  | 'VALE'
  | 'OTHER';

export class PaymentTypeDto {
  code: PaymentTypeCode;
  amount: number;
  change_for: number;
  complement?: 'pix' | string;
  type: 'OFFLINE' | 'ONLINE';
}

export class ChoiceDto {
  integration_code: string;
  desc_item_choice: string;
  aditional_price: number;
  quantity: number;
  notes?: string;
}

export class ItemDto {
  integration_code: string;
  desc_item: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  choice_items: Array<ChoiceDto>;
}

export class CreateOrderDto {
  order_id: string;
  display_id: string;
  cod_store: string;
  created_at: string;
  total_discount: number;
  total_amount: number;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  order_method: {
    mode: 'DELIVERY' | 'TAKEOUT';
    delivery_by: 'PARTNER' | 'RESTAURANT';
    delivery_fee: number;
    scheduled: boolean;
    delivery_date_time?: string;
  };
  items: Array<ItemDto>;
  payment_types: Array<PaymentTypeDto>;
  delivery_address?: DeliveryAddressDto;
}
