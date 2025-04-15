export class CreateFoodyOrderDto {
  id: string;
  status: 'open' | 'ready';
  deliveryFee?: number;
  paymentMethod?:
    | 'money'
    | 'card'
    | 'online'
    | 'on_credit'
    | 'pix'
    | 'e_wallet';
  notes?: string;
  courierFee?: number;
  orderTotal?: number;
  orderDetails?: string;
  ifoodLocalizer?: string;
  deliveryPoint: {
    address: string;
    street?: string; // [logradouro],[número],[bairro]
    houseNumber?: string;
    postalCode: string; // 00000-000 ou 00000000
    coordinates?: {
      lat: number;
      lng: number;
    };
    city?: string;
    region?: string;
    country?: string;
    complement?: string;
  };
  customer?: {
    customerPhone?: string; // +[país][cidade][número]
    customerName?: string;
    customerEmail?: string;
  };
  date?: string;
}
