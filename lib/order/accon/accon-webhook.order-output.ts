import {
  InvalidOrderException,
  Order,
  OrderOutputIntegration,
  RegistryIntegration,
  IntegrationPayload,
  Merchant,
  EventsService,
  IntegrationEventDispatcher,
} from '@lib/core';
import { Injectable, Logger } from '@nestjs/common';
import {
  ACCON_WEBHOOK_CONFIG_SCHEMA,
  AcconWebhookConfig,
} from './accon-webhook.config';
import {
  PaymentDto,
  ProductDto,
  StatusDto,
  WebhookBodyDto,
} from './dto/accon-webhook';
import { InvalidPayloadException } from '@lib/core/exceptions/invalid-payload.exception';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import { OrderEvent, OrderEventType } from '@lib/core/types/order-event.type';

type HookType = 'onOrderCreated' | 'onOrderUpdated' | 'onOrderCanceled';

@RegistryIntegration({
  id: 'accon-webhook',
  type: 'OrderOutput',
  title: 'Accon 1.0 Webhook',
  category: 'POS',
  description: 'Integre pedidos via Webhook utilizando o formato da Accon 1.0',
  logoUrl:
    'https://accon.com.br/wp-content/uploads/2024/08/Accon-Logo-Roxa.webp',
  websiteUrl: 'https://accon.com.br/',
  configSchema: ACCON_WEBHOOK_CONFIG_SCHEMA,
})
@Injectable()
export class AcconWebhookOrderOutput
  implements OrderOutputIntegration<AcconWebhookConfig>
{
  private readonly dispatchEvent: IntegrationEventDispatcher;
  private readonly logger = new Logger(AcconWebhookOrderOutput.name);
  constructor(
    private readonly httpService: HttpService,
    readonly eventsService: EventsService,
  ) {
    this.dispatchEvent = eventsService.createDispatcherFor(
      'Accon Webhook',
      'OrderOutput',
    );
  }

  onOrderCreated(
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ): Promise<void> {
    return this.callHook('onOrderCreated', payload, config);
  }

  onOrderUpdated?(
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ): Promise<void> {
    return this.callHook('onOrderUpdated', payload, config);
  }

  onOrderCanceled?(
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ): Promise<void> {
    return this.callHook('onOrderCanceled', payload, config);
  }

  async callHook(
    type: HookType,
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ) {
    const key: Record<HookType, keyof AcconWebhookConfig> = {
      onOrderCreated: 'onCreatedURL',
      onOrderUpdated: 'onUpdatedURL',
      onOrderCanceled: 'onCanceledURL',
    };
    const url = config[key[type]];
    if (typeof url !== 'string') {
      this.logger.warn(`${type}: Configuração de URL ausente`);
      return;
    }

    const { order } = payload;
    const orderId = parseInt(order.externalId);
    this.dispatchEvent({
      eventType: 'INTEGRATION_INITIATED',
      orderId,
    });
    this.logger.debug(`${type}: Transformando o pedido com id: ${order.id}`);
    this.dispatchEvent({
      eventType: 'INTEGRATION_PROCESSING',
      orderId,
    });
    const body = this.transformOrder(payload);
    this.logger.debug(`${type}: Pedido transformado`, body);

    try {
      const { status, data } = await firstValueFrom(
        this.httpService.post(url, body, { timeout: 5000 }),
      );
      this.dispatchEvent({
        eventType: 'INTEGRATION_COMPLETED',
        orderId,
        metadata: { data, status },
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const errorData = error.response?.data ?? error.message;
        this.logger.error(`${type}: falha ao enviar para ${url}`, errorData);
        this.dispatchEvent({
          eventType: 'INTEGRATION_FAILED',
          orderId,
          metadata: { error: error.response?.data },
        });
      } else {
        this.dispatchEvent({
          eventType: 'INTEGRATION_FAILED',
          orderId,
          metadata: { error },
        });
        this.logger.error(`${type}: ${error.message}`, error);
      }
    }
  }

  transformOrder(payload: IntegrationPayload): WebhookBodyDto {
    const { order, merchant, events } = payload;
    if (!merchant) {
      throw new InvalidPayloadException(
        'Os dados do estabelecimento são obrigatórios para integração',
        'merchant',
      );
    }

    if (!order.customer) {
      throw new InvalidOrderException(
        'O pedido não possui cliente',
        'customer',
      );
    }

    const deliveryFee = order.otherFees.find(
      ({ type }) => type === 'DELIVERY_FEE',
    );
    const { delivery } = order;

    const changeFor = order.payments.methods?.reduce((acc, method) => {
      return acc + (method.changeFor ?? 0);
    }, 0);

    return {
      _id: order.id,
      delivery: order.type === 'DELIVERY',
      canceled:
        events?.some(
          ({ eventType }) => eventType === OrderEventType.CANCELLED,
        ) || false,
      scheduled: order.orderTiming === 'SCHEDULED',
      sequential: order.displayId,
      store: {
        _id: order.merchant.id,
        name: order.merchant.name,
        address: {
          address: merchant.address.street,
          number: merchant.address.number,
          complement: merchant.address.complement ?? undefined,
          city: merchant.address.city,
          state: merchant.address.state,
          zip: merchant.address.postalCode,
          latlng: {
            lat: parseFloat(merchant.address.latitude.toString()),
            lng: parseFloat(merchant.address.longitude.toString()),
          },
        },
        details: {
          document: merchant.document,
          email: merchant.contactEmails[0],
          phone: merchant.commercialNumber,
          socialName: merchant.corporateName,
          storePhone: merchant.commercialNumber,
        },
        deliveryTime: '40',
        toGoTime: '30',
      },
      deliveryTax: deliveryFee?.price?.value || 0,
      address: delivery?.deliveryAddress
        ? {
            address: delivery.deliveryAddress.street,
            number: delivery.deliveryAddress.number,
            complement: delivery.deliveryAddress.complement,
            city: delivery.deliveryAddress.city,
            state: delivery.deliveryAddress.state,
            zip: delivery.deliveryAddress.postalCode,
            latlng: {
              lat: parseFloat(
                delivery.deliveryAddress.coordinates.latitude.toString(),
              ),
              lng: parseFloat(
                delivery.deliveryAddress.coordinates.longitude.toString(),
              ),
            },
          }
        : undefined,
      date: order.createdAt,
      scheduledDate: order.schedule?.scheduledDateTimeStart,
      subtotal: order.total.itemsPrice.value,
      discount: order.total.discount.value,
      total: order.total.orderAmount.value,
      status: this.transformEvents(events ?? []),
      user: {
        _id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone.number,
        email: order.customer.email,
        document: order.customer.documentNumber,
        totalOrders: order.customer.ordersCountOnMerchant,
      },
      notes: order.extraInfo,
      change: changeFor,
      source: order.salesChannel ?? 'ecommerce',
      network: '000000000000000000000000', // Magic network ID
      payment: this.transformPayment(order),
      voucher: this.transformVoucher(order),
      products: this.transformProducts(order),
    };
  }

  transformProducts(order: Order): ProductDto[] {
    return order.items.map((item, index) => ({
      id: item.id,
      name: item.name,
      notes: item.specialInstructions ?? '',
      quantity: item.quantity,
      total: item.totalPrice.value,
      modifiers: (item.options ?? []).map((modifier) => ({
        id: modifier.id,
        name: modifier.name,
        price: {
          actualPrice: modifier.unitPrice.value,
          originalPrice: 0,
          starterPrice: 0,
        },
        quantity: modifier.quantity,
        group: index.toString(),
        externalVendorCode: modifier.externalCode,
      })),
      group: index.toString(),
      externalVendorCode: item.externalCode,
    }));
  }

  transformVoucher(order: Order) {
    return order.discounts
      .filter((discount) => discount.sponsorshipValues.length > 0)
      .map((discount) => {
        const sponsorship = discount.sponsorshipValues[0];
        return {
          rede: '000000000000000000000000',
          stores: [order.merchant.id],
          fidelity: sponsorship?.discountCode === 'CASHBACK',
          name: sponsorship?.name ?? '',
          text: sponsorship?.discountCode ?? '',
          products: [],
          is_active: true,
          value: discount.amount.value,
          percent: false,
          recurrent: false,
        };
      });
  }

  transformEvents(events: OrderEvent[]): StatusDto[] {
    if (!events.length) {
      return [
        {
          name: 'Realizado',
          obs: '',
          date: new Date().toISOString(),
        },
      ];
    }

    const ACCON_ALLOWED_STATUS = [
      OrderEventType.CREATED,
      OrderEventType.CONFIRMED,
      OrderEventType.READY_FOR_PICKUP,
      OrderEventType.DISPATCHED,
      OrderEventType.CONCLUDED,
      OrderEventType.CANCELLED,
    ];

    const allowedEvents = events.filter((event) =>
      ACCON_ALLOWED_STATUS.includes(event.eventType),
    );

    return allowedEvents
      .map((event) => ({
        date: new Date(event.createdAt).toISOString(),
        obs: '',
        name: ((eventType: OrderEventType) => {
          switch (eventType) {
            case OrderEventType.CREATED:
              return 'Realizado';
            case OrderEventType.CONFIRMED:
              return 'confirmado';
            case OrderEventType.DISPATCHED:
            case OrderEventType.READY_FOR_PICKUP:
              return 'pronto';
            case OrderEventType.DELIVERED:
            case OrderEventType.CONCLUDED:
              return 'finalizado';
            case OrderEventType.CANCELLED:
              return 'cancelado';
            default:
              throw new Error(`Invalid status eventType: ${eventType}`);
          }
        })(event.eventType),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  transformPayment(order: Order): PaymentDto {
    if (order.payments.methods.length !== 1) {
      throw new InvalidOrderException(
        'O pedido deve possuír apenas um método de pagamento',
        'payments',
      );
    }
    const { type, method, brand, transaction } = order.payments.methods[0];
    const online = type === 'PREPAID';

    const METHOD_NAMES = new Map([
      ['PIX', 'Pix'],
      ['CASH', 'Dinheiro'],
      ['CREDIT', 'Crédito'],
      ['DEBIT', 'Débito'],
      ['MEAL_VOUCHER', 'Voucher'],
      ['FOOD_VOUCHER', 'Carteira Digital'],
      ['DIGITAL_WALLET', 'Carteira Digital'],
      ['CREDIT_DEBIT', 'Cartão de Crédito/Débito'],
      ['COUPON', 'Cupom'],
      ['REDEEM', 'Outros'],
      ['PREPAID_REDEEM', 'Outros'],
      ['OTHER', 'Outros'],
    ]);

    const CARD_METHODS: Array<typeof method> = [
      'CREDIT',
      'CREDIT_DEBIT',
      'DEBIT',
    ];

    return {
      cod: online ? '5c51aeba22c5d6596c5ac4b0' : '64554e3809a8eead82e2d4f2',
      online,
      pix: online && method === 'PIX',
      tid: transaction?.authorizationCode,
      authorizationCode: transaction?.authorizationCode,
      name:
        CARD_METHODS.includes(method) && brand
          ? brand
          : (METHOD_NAMES.get(method) ?? 'Outros'),
    };
  }
}
