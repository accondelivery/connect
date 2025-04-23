import {
  InvalidOrderException,
  Order,
  OrderOutputIntegration,
  RegistryIntegration,
  IntegrationPayload,
  Merchant,
} from '@lib/core';
import { Injectable } from '@nestjs/common';
import {
  ACCON_WEBHOOK_CONFIG_SCHEMA,
  AcconWebhookConfig,
} from './accon-webhook.config';
import { PaymentDto, WebhookBodyDto } from './dto/accon-webhook';
import { InvalidPayloadException } from '@lib/core/exceptions/invalid-payload.exception';

@RegistryIntegration({
  id: 'accon-webhook',
  type: 'OrderOutput',
  title: 'Accon 1.0 Webhook',
  category: 'POS',
  description: 'Integre pedidos via Webhook utilizando o formato da Accon 1.0',
  logoUrl: 'https://accon.com.br/',
  websiteUrl: 'https://accon.com.br/',
  configSchema: ACCON_WEBHOOK_CONFIG_SCHEMA,
})
@Injectable()
export class AcconWebhook
  implements OrderOutputIntegration<AcconWebhookConfig>
{
  async onOrderCreated(
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ): Promise<void> {}

  async onOrderUpdated?(
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async onOrderCanceled?(
    payload: IntegrationPayload,
    config: AcconWebhookConfig,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  transformOrder(order: Order, merchant: Merchant): WebhookBodyDto {
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
      return acc + method.changeFor;
    }, 0);

    return {
      _id: order.id,
      delivery: order.type === 'DELIVERY',
      canceled: false,
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
            lat: merchant.address.latitude,
            lng: merchant.address.longitude,
          },
        },
        details: {
          document: merchant.document,
          email: merchant.contactEmails[0],
          phone: merchant.commercialNumber,
          socialName: merchant.corporateName,
          storePhone: merchant.commercialNumber,
        },
        deliveryTime: '',
        toGoTime: '',
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
              lat: delivery.deliveryAddress.coordinates.latitude,
              lng: delivery.deliveryAddress.coordinates.longitude,
            },
          }
        : undefined,
      date: order.createdAt,
      scheduledDate: order.schedule?.scheduledDateTimeStart,
      subtotal: order.total.itemsPrice.value,
      discount: order.total.discount.value,
      total: order.total.orderAmount.value,
      status: [],
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
    };
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

    return {
      cod: '',
      online,
      pix: online && method === 'PIX',
      tid: transaction?.authorizationCode,
      authorizationCode: transaction?.authorizationCode,
      name: (() => {
        const CARD_METHODS: Array<typeof method> = [
          'CREDIT',
          'CREDIT_DEBIT',
          'DEBIT',
        ];
        if (CARD_METHODS.includes(method) && brand) return brand;
        switch (method) {
          case 'PIX':
            return 'Pix';
          case 'CASH':
            return 'Dinheiro';
          case 'CREDIT':
            return 'Crédito';
          case 'DEBIT':
            return 'Débito';
          case 'MEAL_VOUCHER':
            return 'Voucher';
          case 'FOOD_VOUCHER':
          case 'DIGITAL_WALLET':
            return 'Carteira Digital';
          case 'CREDIT_DEBIT':
            return 'Cartão de Crédito/Débito';
          case 'COUPON':
            return 'Cupom';
          case 'REDEEM':
          case 'PREPAID_REDEEM':
          case 'OTHER':
            return 'Outros';
        }
      })(),
    };
  }
}
