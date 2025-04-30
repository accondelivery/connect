export type EventName =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARATION_REQUESTED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'READY_FOR_PICKUP'
  | 'PICKUP_AREA_ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CONCLUDED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLATION_REQUEST_DENIED'
  | 'CANCELLED'
  | 'ORDER_CANCELLATION_REQUEST'
  | 'CANCELLED_DENIED';

export type Price = {
  value: number;
  currency: 'BRL';
};

export type Unit = 'UN' | 'KG' | 'L' | 'OZ' | 'LB' | 'GAL';

export type Order = {
  id: string;
  type: 'DELIVERY' | 'TAKEOUT' | 'INDOOR';
  displayId: string;
  sourceAppId?: string;
  salesChannel?: string;
  virtualBrand?: string;
  createdAt: string;
  lastEvent?: EventName;
  orderTiming: 'INSTANT' | 'SCHEDULED' | 'ONDEMAND';
  preparationStartDateTime: string;
  merchant: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    index?: number;
    name: string;
    externalCode: string;
    unit: Unit;
    ean?: string;
    quantity: number;
    specialInstructions?: string;
    unitPrice: Price;
    originalPrice?: Price;
    scalePriceApplied?: boolean;
    optionsPrice?: Price;
    subtotalPrice?: Price;
    totalPrice: Price;
    indoor?: {
      productionPoint?: string;
    };
    options?: {
      index?: number;
      id: string;
      name: string;
      externalCode: string;
      unit: Unit;
      ean?: string;
      quantity: number;
      unitPrice: Price;
      originalPrice?: Price;
      subtotalPrice?: Price;
      totalPrice: Price;
      specialInstructions: string;
    }[];
  }[];
  otherFees: {
    name: string;
    type: 'DELIVERY_FEE' | 'SERVICE_FEE' | 'TIP';
    receivedBy: 'MARKETPLACE' | 'MERCHANT' | 'LOGISTIC_SERVICES';
    receiverDocument?: string;
    price: Price;
    observation?: string;
  }[];
  discounts: {
    amount: Price;
    target: 'CART' | 'DELIVERY_FEE' | 'ITEM';
    targetId?: string;
    sponsorshipValues: {
      name: string;
      amount: Price;
      discountCode?: string;
    };
  }[];
  total: {
    itemsPrice: Price;
    otherFees: Price;
    discount: Price;
    orderAmount: Price;
  };
  payments: {
    prepaid: number;
    pending: number;
    methods: {
      value: number;
      currency: string;
      type: 'PREPAID' | 'PENDING';
      method:
        | 'CREDIT'
        | 'DEBIT'
        | 'MEAL_VOUCHER'
        | 'FOOD_VOUCHER'
        | 'DIGITAL_WALLET'
        | 'PIX'
        | 'CASH'
        | 'CREDIT_DEBIT'
        | 'COUPON'
        | 'REDEEM'
        | 'PREPAID_REDEEM'
        | 'OTHER';
      brand?:
        | 'VISA'
        | 'MASTERCARD'
        | 'DINERS'
        | 'AMEX'
        | 'HIPERCARD'
        | 'ELO'
        | 'AURA'
        | 'DISCOVER'
        | 'VR_BENEFICIOS'
        | 'SODEXO'
        | 'TICKET'
        | 'GOOD_CARD'
        | 'BANESCARD'
        | 'SOROCARD'
        | 'POLICARD'
        | 'VALECARD'
        | 'AGICARD'
        | 'JCB'
        | 'CREDSYSTEM'
        | 'CABAL'
        | 'GREEN_CARD'
        | 'VEROCHEQUE'
        | 'AVISTA'
        | 'OTHER';
      methodInfo?: string;
      transaction?: {
        authorizationCode?: string;
        acquirerDocument?: string;
      };
      changeFor: number;
    }[];
  };
  taxInvoice?: {
    issued?: boolean;
    taxInvoiceURL?: string;
  };
  customer?: {
    id: string;
    name: string;
    documentNumber?: string;
    phone: {
      number: string;
      extension: string;
    };
    email?: string;
    ordersCountOnMerchant: number;
  };
  schedule?: {
    scheduledDateTimeStart: string;
    scheduledDateTimeEnd: string;
  };
  orderPriority?:
    | 'PRIORITY1'
    | 'PRIORITY2'
    | 'PRIORITY3'
    | 'PRIORITY4'
    | 'PRIORITY5';
  delivery: {
    deliveredBy: 'MERCHANT' | 'MARKETPLACE';
    deliveryAddress: {
      country: string;
      state: string;
      city: string;
      district: string;
      street: string;
      number: string;
      complement?: string;
      reference?: string;
      formattedAddress: string;
      postalCode: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    estimatedDeliveryDateTime: string;
    deliveryDateTime?: string;
    pickupCode?: string;
  };
  takeout?: {
    mode: 'DEFAULT' | 'PICKUP_AREA';
    takeoutDateTime: string;
  };
  indoor?: {
    mode: 'DEFAULT' | 'PLACE' | 'TAB' | 'TERMINAL';
    indoorDateTime: string;
    place?: string;
    tab?: string;
    seat?: string;
    waiterCode?: string;
  };
  sendPreparing?: boolean;
  sendDelivered?: boolean;
  sendPickedUp?: boolean;
  sendTracking?: boolean;
  extraInfo?: string;
};
