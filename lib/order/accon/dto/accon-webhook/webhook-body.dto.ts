class AddressDto {
  address: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zip: string;
  latlng: {
    lat: number;
    lng: number;
  };
}

class StoreDto {
  _id: string;
  name: string;
  address: AddressDto;
  deliveryTime: string;
  toGoTime: string;
  details: {
    email: string;
    phone: string;
    socialName: string;
    storePhone: string;
    document: string;
  };
}

class UserDto {
  _id: string;
  name: string;
  document?: string;
  email?: string;
  phone: string;
  totalOrders: number;
}

class PaymentDto {
  type?: 'credit_card' | 'voucher' | 'ticket' | 'pix';
  online: boolean;
  name: string;
  cod: string;
  pix: boolean;
  externalVendorCode?: string;
  authorizationCode?: string;
  tid?: string;
  card?: string;
  operator?: string;
  refunded?: string;
}

class RatingDto {
  stars: number;
  improvements: string[];
  notes?: string;
  reply?: string;
}

class StatusDto {
  name: string;
  date: string;
  obs?: string;
}

class WebhookBodyDto {
  _id: string;
  network: string;
  session_id?: string;
  sequential: string;
  store: StoreDto;
  user: UserDto;
  address?: AddressDto;
  delivery: boolean;
  date: string;
  deliveryTax: number;
  discount: number;
  subtotal: number;
  total: number;
  change: number;
  payment: PaymentDto;
  voucher?: {};
  status: StatusDto[];
  canceled: boolean;
  scheduled: boolean;
  scheduledDate?: string;
  ip?: string;
  source: string;
  rating?: RatingDto;
  notes?: string;
  document?: string;
}

export { WebhookBodyDto, PaymentDto, StatusDto };
