export class AddressDto {
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

export class StoreDto {
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

export class UserDto {
  _id: string;
  name: string;
  document?: string;
  email?: string;
  phone: string;
  totalOrders: number;
}

export class PaymentDto {
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

export class RatingDto {
  stars: number;
  improvements: string[];
  notes?: string;
  reply?: string;
}

export class StatusDto {
  name: string;
  date: string;
  obs?: string;
}

export class ModifierDto {
  id: string;
  name: string;
  price: {
    actualPrice: number;
    originalPrice: number;
    starterPrice: number;
  };
  quantity: number;
  group: string;
  externalVendorCode?: string;
}

export class ProductDto {
  id: string;
  name: string;
  quantity: number;
  modifiers: ModifierDto[];
  notes: string;
  total: number;
  externalVendorCode?: string;
}

export class WebhookBodyDto {
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
  products: ProductDto[];
}
