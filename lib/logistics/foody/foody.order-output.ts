import { Injectable, Logger } from '@nestjs/common';
import {
  EventsService,
  RegistryIntegration,
  OrderOutputIntegration,
  Order,
  InvalidOrderException,
  IntegrationEventDispatcher,
} from '@lib/core';
import { FOODY_CONFIG_SCHEMA, FoodyConfig } from './foody.config';
import { CreateFoodyOrderDto } from './dto/create-foody-order.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateFoodyOrderResponseDto } from './dto/create-foody-order-response.dto';
import { AxiosResponse, isAxiosError } from 'axios';

@RegistryIntegration({
  id: 'foody-delivery',
  type: 'OrderOutput',
  title: 'Foody Delivery',
  category: 'Logistics',
  description:
    'Sistema de logística urbana pioneiro do mercado, simplificando operações desde 2015 para estabelecimentos de delivery e empresas de entregas',
  logoUrl:
    'https://foodydelivery.com/wp-content/uploads/2021/02/Logo-Foody-retangular-300x100.png',
  websiteUrl: 'https://foodydelivery.com/',
  configSchema: FOODY_CONFIG_SCHEMA,
})
@Injectable()
export class FoodyOrderOutput implements OrderOutputIntegration<FoodyConfig> {
  private readonly logger = new Logger(FoodyOrderOutput.name);
  private readonly BASE_URL = 'https://app.foodydelivery.com/rest/1.2';
  private readonly dispatchEvent: IntegrationEventDispatcher;

  constructor(
    readonly eventsService: EventsService,
    private readonly httpService: HttpService,
  ) {
    this.dispatchEvent = eventsService.createDispatcherFor(
      'Foody',
      'OrderOutput',
    );
  }

  async onOrderCreated(order: Order, config: FoodyConfig): Promise<void> {
    this.logger.verbose('onOrderCreated: iniciando integração');
    if (order.type != 'DELIVERY') {
      this.logger.verbose('Ignorando pedido com tipo diferente de DELIVERY');
      return;
    }

    try {
      this.dispatchEvent({
        eventType: 'INTEGRATION_INITIATED',
        orderId: order.id,
      });
      this.logger.debug(
        `onOrderCreated: Transformando o pedido com id: ${order.id}`,
      );
      this.dispatchEvent({
        eventType: 'INTEGRATION_PROCESSING',
        orderId: order.id,
      });
      const body = this.transformOrder(order);
      this.logger.debug('onOrderCreated: Pedido transformado', body);

      this.logger.verbose('onOrderCreated: Enviando requisição para Foody');
      const { data } = await firstValueFrom<
        AxiosResponse<CreateFoodyOrderResponseDto>
      >(
        this.httpService.post<CreateFoodyOrderResponseDto>(
          `${this.BASE_URL}/orders`,
          body,
          {
            headers: { Authorization: config.authorizationToken },
          },
        ),
      );

      this.logger.debug('onOrderCreated: Resposta do Foody', data);
      this.dispatchEvent({
        eventType: 'INTEGRATION_COMPLETED',
        orderId: order.id,
        metadata: { data },
      });
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          'onOrderCreated: falha ao realizar requisição no Foody',
          JSON.stringify(error.response?.data),
        );
        this.dispatchEvent({
          eventType: 'INTEGRATION_FAILED',
          orderId: order.id,
          metadata: { error: error.response?.data },
        });
      } else {
        this.dispatchEvent({
          eventType: 'INTEGRATION_FAILED',
          orderId: order.id,
          metadata: { error },
        });
        this.logger.error(
          'onOrderCreated: falha ao criar pedido no Foody',
          error,
        );
      }
    }
  }

  transformPayment(
    order: Order,
  ): 'money' | 'card' | 'online' | 'on_credit' | 'pix' | 'e_wallet' {
    if (order.payments.prepaid && order.payments.pending === 0) {
      return 'online';
    }

    if (order.payments.methods.length) {
      const method = order.payments.methods[0];
      switch (method.method) {
        case 'CASH':
          return 'money';
        case 'DEBIT':
        case 'MEAL_VOUCHER':
        case 'FOOD_VOUCHER':
        case 'CREDIT_DEBIT':
        case 'COUPON':
        case 'REDEEM':
        case 'PREPAID_REDEEM':
        case 'OTHER':
        case 'CREDIT':
          return 'card';
        case 'DIGITAL_WALLET':
          return 'e_wallet';
        case 'PIX':
          return 'pix';
      }
    }

    this.logger.warn(
      `Não foi possível transformar o método de pagamento`,
      order.payments,
    );

    return 'card';
  }

  transformOrder(order: Order): CreateFoodyOrderDto {
    const { delivery } = order;
    if (!delivery || !delivery.deliveryAddress) {
      throw new InvalidOrderException(
        'Pedido não contém informações sobre delivery',
        'delivery',
      );
    }
    const deliveryFee = order.otherFees.find(
      (fee) => fee.type === 'SERVICE_FEE',
    );

    return {
      id: order.id,
      status: 'open',
      deliveryFee: deliveryFee?.price.value,
      paymentMethod: this.transformPayment(order),
      deliveryPoint: {
        address: delivery.deliveryAddress.formattedAddress,
        street: delivery.deliveryAddress.street,
        houseNumber: delivery.deliveryAddress.number,
        city: delivery.deliveryAddress.city,
        complement: delivery.deliveryAddress.complement,
        region: delivery.deliveryAddress.district,
        postalCode: delivery.deliveryAddress.postalCode.replace(/\D/g, ''),
        country: 'BR',
        coordinates: {
          lat: delivery.deliveryAddress.coordinates.latitude,
          lng: delivery.deliveryAddress.coordinates.longitude,
        },
      },
      date: order.createdAt,
      customer: {
        customerName: order.customer?.name,
        customerPhone: `+55${order.customer?.phone?.number?.replace(/\D/g, '')}`,
      },
      orderTotal: order.total.orderAmount.value,
    };
  }
}
