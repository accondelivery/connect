import {
  EventsService,
  IntegrationEventDispatcher,
  IntegrationPayload,
  InvalidOrderException,
  Order,
  OrderOutputIntegration,
  RegistryIntegration,
} from '@lib/core';
import { Injectable, Logger } from '@nestjs/common';
import { SAIPOS_CONFIG_SCHEMA, SaiposConfig } from './saipos.config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrderDto,
  ItemDto,
  PaymentTypeCode,
  PaymentTypeDto,
} from './dto/create-order.dto';
import { isAxiosError } from 'axios';
import * as moment from 'moment';

@RegistryIntegration({
  id: 'saipos',
  category: 'POS',
  type: 'OrderOutput',
  title: 'Saipos',
  description: 'Saipos, Sistema para Restaurante simples, ágil e inteligente',
  logoUrl:
    'https://cms-cdn.saipos.com/assets/2022/06/02/saipos_uid_62991602390a5.jpg',
  websiteUrl: 'https://saipos.com/',
  configSchema: SAIPOS_CONFIG_SCHEMA,
})
@Injectable()
export class SaiposOrderOutput implements OrderOutputIntegration<SaiposConfig> {
  private readonly logger: Logger = new Logger(SaiposOrderOutput.name);
  private readonly SAIPOS_BASE_URL = 'https://homolog-order-api.saipos.com';
  private readonly SAIPOS_SECRET;
  private readonly ALLOWED_ORDER_TYPES = ['DELIVERY', 'TAKEOUT'];
  private readonly dispatchEvent: IntegrationEventDispatcher;

  constructor(
    readonly eventsService: EventsService,
    private readonly httpService: HttpService,
  ) {
    this.SAIPOS_SECRET =
      process.env.SAIPOS_SECRET || 'affbd9122769388cb943ca74fd589617';
    if (!this.SAIPOS_SECRET)
      this.logger.error('SAIPOS_SECRET não fornecido via ambiente');

    this.dispatchEvent = eventsService.createDispatcherFor(
      'Saipos',
      'OrderOutput',
    );
  }

  async authenticate(idPartner: string) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SAIPOS_BASE_URL}/auth`, {
        idPartner,
        secret: this.SAIPOS_SECRET,
      }),
    );
    return data?.token;
  }

  async onOrderCreated(
    payload: IntegrationPayload,
    config: SaiposConfig,
  ): Promise<void> {
    this.logger.verbose('onOrderCreated: iniciando integração');

    const { order } = payload;

    if (!this.ALLOWED_ORDER_TYPES.includes(order.type)) {
      this.logger.verbose(
        `Ignorando tipo de pedido não permitido: ${order.type} [${this.ALLOWED_ORDER_TYPES.join(',')}]`,
      );
      return;
    }
    const orderId = parseInt(order.externalId);
    this.dispatchEvent({
      eventType: 'INTEGRATION_INITIATED',
      orderId,
    });

    this.dispatchEvent({
      eventType: 'INTEGRATION_PROCESSING',
      orderId,
    });

    try {
      const body = this.transformOrder(order);
      const token = await this.authenticate(config.idPartner);
      if (!token) {
        throw new Error('Não foi possível autenticar com a Saipos');
      }

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.SAIPOS_BASE_URL}/order`, body, {
          headers: {
            Authorization: token,
          },
        }),
      );

      this.dispatchEvent({
        eventType: 'INTEGRATION_COMPLETED',
        orderId,
        metadata: {
          data,
        },
      });

      return;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          'onOrderCreated: falha ao realizar requisição no Saipos',
          JSON.stringify(error.response?.data),
        );
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
        this.logger.error(
          'onOrderCreated: falha ao criar pedido no Saipos',
          error,
        );
      }
    }
  }

  async onOrderUpdated?(
    payload: IntegrationPayload,
    config: SaiposConfig,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async onOrderCanceled?(
    payload: IntegrationPayload,
    config: SaiposConfig,
  ): Promise<void> {
    this.logger.verbose('onOrderCanceled: iniciando integração');

    const { order } = payload;

    if (!this.ALLOWED_ORDER_TYPES.includes(payload.order.type)) {
      this.logger.verbose(
        `Ignorando tipo de pedido não permitido: ${order.type} [${this.ALLOWED_ORDER_TYPES.join(',')}]`,
      );
      return;
    }

    const orderId = parseInt(order.externalId);
    this.dispatchEvent({
      eventType: 'INTEGRATION_INITIATED',
      orderId,
    });

    this.dispatchEvent({
      eventType: 'INTEGRATION_PROCESSING',
      orderId,
    });

    try {
      const token = await this.authenticate(config.idPartner);
      if (!token) {
        throw new Error('Não foi possível autenticar com a Saipos');
      }

      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.SAIPOS_BASE_URL}/cancel-order`,
          { order_id: order.id, cod_store: config.idPartner },
          {
            headers: {
              Authorization: token,
            },
          },
        ),
      );

      this.dispatchEvent({
        eventType: 'INTEGRATION_COMPLETED',
        orderId,
        metadata: {
          data,
        },
      });
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          'onOrderCanceled: falha ao realizar requisição no Saipos',
          JSON.stringify(error.response?.data),
        );
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
        this.logger.error(
          'onOrderCanceled: falha ao cancelar pedido no Saipos',
          error,
        );
      }
    }
  }

  transformPayment(order: Order): Array<PaymentTypeDto> {
    return order.payments.methods.map((method) => {
      let code: PaymentTypeCode;
      switch (method.method) {
        case 'CREDIT':
          code = 'CRE';
          break;
        case 'DEBIT':
          code = 'DEB';
          break;
        case 'MEAL_VOUCHER':
        case 'FOOD_VOUCHER':
          code = 'VALE';
          break;
        case 'PIX':
          code = 'PARTNER_PAYMENT';
          break;
        case 'CASH':
          code = 'DIN';
          break;
        case 'CREDIT_DEBIT':
          code = 'CARD';
          break;
        case 'DIGITAL_WALLET':
        case 'COUPON':
        case 'REDEEM':
        case 'PREPAID_REDEEM':
        case 'OTHER':
          code = 'OTHER';
          break;
        default:
          code = 'OTHER';
          break;
      }
      if (!code) {
        throw new InvalidOrderException(
          `Forma de pagamento inválida: ${method.method}`,
          'payments',
        );
      }

      return {
        code,
        amount: method.value,
        change_for: method.changeFor || 0,
        type: method.type === 'PREPAID' ? 'ONLINE' : 'OFFLINE',
        complement: method.method === 'PIX' ? 'pix' : undefined,
      };
    });
  }

  transformItems(order: Order): Array<ItemDto> {
    return order.items.map((item) => {
      const options = item.options?.map((option) => {
        return {
          integration_code: option.externalCode,
          desc_item_choice: option.name,
          aditional_price: option.unitPrice.value,
          quantity: option.quantity,
        };
      });

      return {
        desc_item: item.name,
        integration_code: item.externalCode,
        notes: item.specialInstructions,
        quantity: item.quantity,
        unit_price: item.unitPrice.value,
        choice_items: options ?? [],
      };
    });
  }

  getDeliveryDateTime(order: Order) {
    if (order.schedule?.scheduledDateTimeStart) {
      return order.schedule.scheduledDateTimeStart;
    }
    // TODO: get information from merchant
    return moment(order.createdAt).add(30, 'minutes').toISOString();
  }

  transformOrder(order: Order): CreateOrderDto {
    if (!order.customer) {
      throw new InvalidOrderException('Pedido sem cliente', 'customer');
    }

    if (order.type !== 'DELIVERY' && order.type !== 'TAKEOUT') {
      throw new InvalidOrderException('Tipo de pedido inválido', 'type');
    }

    const deliveryFee = order.otherFees.find(
      ({ type }) => type === 'DELIVERY_FEE',
    );

    const dto: CreateOrderDto = {
      order_id: order.id,
      display_id: order.displayId,
      cod_store: order.merchant.id.toString(),
      created_at: order.createdAt,
      total_discount: order.total.discount?.value ?? 0,
      total_amount: order.total.orderAmount.value,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone.number,
      },
      order_method: {
        mode: order.type,
        delivery_by: 'RESTAURANT',
        delivery_fee: deliveryFee?.price.value ?? 0,
        scheduled: order.orderTiming === 'SCHEDULED',
        delivery_date_time: this.getDeliveryDateTime(order),
      },
      items: this.transformItems(order),
      payment_types: this.transformPayment(order),
    };

    if (order.type === 'DELIVERY') {
      if (!order.delivery) {
        throw new InvalidOrderException(
          'Pedido de delivery sem informações para entrega',
          'delivery',
        );
      }

      const {
        delivery: { deliveryAddress },
      } = order;
      dto.delivery_address = {
        country: 'BR',
        state: deliveryAddress.state,
        city: deliveryAddress.city,
        district: deliveryAddress.district,
        street_name: deliveryAddress.street,
        street_number: deliveryAddress.number,
        postal_code: deliveryAddress.postalCode,
        reference: deliveryAddress.reference,
        complement: deliveryAddress.complement,
        coordinates: deliveryAddress.coordinates,
      };
    }

    return dto;
  }
}
