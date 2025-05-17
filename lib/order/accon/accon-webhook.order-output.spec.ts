import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AcconWebhookOrderOutput } from './accon-webhook.order-output';
import { EventsService, Merchant, Order } from '@lib/core';
import { InvalidOrderException } from '@lib/core';
import { AxiosError } from 'axios';

describe('AcconWebhookOrderOutput', () => {
  let service: AcconWebhookOrderOutput;
  let httpService: HttpService;
  let eventsService: EventsService;
  const dispatchMock = jest.fn();

  const order = {
    id: 'order_1',
    displayId: '1001',
    type: 'DELIVERY',
    orderTiming: 'REAL_TIME',
    createdAt: new Date(),
    total: {
      itemsPrice: { value: 1000 },
      discount: { value: 100 },
      orderAmount: { value: 900 },
    },
    customer: {
      id: 'cust_1',
      name: 'John Doe',
      phone: { number: '61999999999' },
      email: 'john@example.com',
      documentNumber: '12345678900',
      ordersCountOnMerchant: 3,
    },
    extraInfo: 'Sem cebola',
    payments: {
      methods: [
        {
          type: 'PREPAID',
          method: 'PIX',
          transaction: { authorizationCode: 'abc123' },
        },
      ],
    },
    merchant: { id: 'm1', name: 'Restaurante 1' },
    otherFees: [],
    salesChannel: 'ecommerce',
  } as unknown as Order;

  const merchant: Merchant = {
    id: 1,
    name: 'Restaurante 1',
    address: {
      id: 2,
      street: 'Rua A',
      number: '123',
      complement: '',
      city: 'Goiânia',
      state: 'GO',
      postalCode: '74000000',
      district: 'Setor Bueno',
      IBGECityCode: null,
      IBGEStateCode: null,
      reference: null,
      latitude: -16.6864,
      longitude: -49.2643,
    },
    document: '00000000000191',
    contactEmails: ['restaurante@example.com'],
    commercialNumber: '6232323232',
    corporateName: 'Restaurante Ltda',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcconWebhookOrderOutput,
        {
          provide: HttpService,
          useValue: { post: jest.fn() },
        },
        {
          provide: EventsService,
          useValue: {
            createDispatcherFor: jest.fn().mockReturnValue(dispatchMock),
          },
        },
      ],
    }).compile();

    service = module.get(AcconWebhookOrderOutput);
    httpService = module.get(HttpService);
    eventsService = module.get(EventsService);

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transformOrder', () => {
    it('should transform a valid order and merchant', () => {
      const result = service.transformOrder(order, merchant);
      expect(result._id).toBe(order.id);
      expect(result.user.name).toBe(order.customer!.name);
      expect(result.store.name).toBe(merchant.name);
      expect(result.payment.name).toBe('Pix');
    });

    it('should throw if merchant is not provided', () => {
      expect(() =>
        service.transformOrder(order, undefined as any),
      ).toThrowError(/estabelecimento são obrigatórios/);
    });

    it('should throw if order has no customer', () => {
      const orderWithoutCustomer = { ...order, customer: undefined };
      expect(() =>
        service.transformOrder(orderWithoutCustomer, merchant),
      ).toThrowError(/pedido não possui cliente/);
    });

    it('should fallback deliveryTax to 0 if no DELIVERY_FEE is found', () => {
      const transformed = service.transformOrder(
        { ...order, otherFees: [] },
        merchant,
      );
      expect(transformed.deliveryTax).toBe(0);
    });

    it('should extract deliveryFee from otherFees when type is DELIVERY_FEE', () => {
      const deliveryFee = {
        type: 'DELIVERY_FEE',
        price: { value: 123 },
      } as unknown as any;
      const transformed = service.transformOrder(
        { ...order, otherFees: [deliveryFee] },
        merchant,
      );
      expect(transformed.deliveryTax).toBe(123);
    });

    it('should set address to undefined if no delivery address is present', () => {
      const orderWithoutDelivery = { ...order, delivery: undefined };
      const transformed = service.transformOrder(
        orderWithoutDelivery as unknown as any,
        merchant,
      );
      expect(transformed.address).toBeUndefined();
    });

    it('should set complement to undefined if not provided', () => {
      const transformed = service.transformOrder(
        { ...order, otherFees: [] },
        {
          ...merchant,
          address: { ...merchant.address, complement: null },
        },
      );
      expect(transformed.store.address.complement).toBeUndefined();
    });

    it('should fallback source to "ecommerce" if salesChannel is not provided', () => {
      const orderWithoutSource = { ...order, salesChannel: undefined };
      const transformed = service.transformOrder(orderWithoutSource, merchant);
      expect(transformed.source).toBe('ecommerce');
    });
  });

  describe('transformPayment', () => {
    it('should transform a PIX prepaid payment correctly', () => {
      const orderWithPix = {
        ...order,
        payments: {
          methods: [
            {
              type: 'PREPAID',
              method: 'PIX',
              transaction: { authorizationCode: 'abc123' },
            },
          ],
        },
      };

      const result = service.transformPayment(orderWithPix as unknown as any);
      expect(result.online).toBe(true);
      expect(result.pix).toBe(true);
      expect(result.tid).toBe('abc123');
      expect(result.authorizationCode).toBe('abc123');
      expect(result.name).toBe('Pix');
    });

    it('should throw if multiple payment methods are provided', () => {
      const invalidOrder = {
        ...order,
        payments: {
          methods: [
            { type: 'PREPAID', method: 'PIX' },
            { type: 'PREPAID', method: 'PIX' },
          ],
        },
      };

      expect(() =>
        service.transformPayment(invalidOrder as unknown as any),
      ).toThrowError(/apenas um método de pagamento/);
    });

    it('should use brand name if card method with brand is provided', () => {
      const orderWithCard = {
        ...order,
        payments: {
          methods: [
            {
              type: 'PREPAID',
              method: 'CREDIT',
              brand: 'Mastercard',
              transaction: { authorizationCode: 'xyz456' },
            },
          ],
        },
      };

      const result = service.transformPayment(orderWithCard as unknown as any);
      expect(result.name).toBe('Mastercard');
    });

    it('should fallback to mapped name if brand is missing', () => {
      const orderWithDebit = {
        ...order,
        payments: {
          methods: [
            {
              type: 'PREPAID',
              method: 'DEBIT',
              transaction: { authorizationCode: 'xyz789' },
            },
          ],
        },
      };

      const result = service.transformPayment(orderWithDebit as unknown as any);
      expect(result.name).toBe('Débito');
    });

    it('should fallback to "Outros" if method is unknown', () => {
      const orderWithUnknownMethod = {
        ...order,
        payments: {
          methods: [
            {
              type: 'PREPAID',
              method: 'UNKNOWN',
              transaction: { authorizationCode: 'zzz000' },
            },
          ],
        },
      };

      const result = service.transformPayment(
        orderWithUnknownMethod as unknown as any,
      );
      expect(result.name).toBe('Outros');
    });
  });

  describe('callHook', () => {
    it('should send POST request and dispatch success events', async () => {
      const url = 'https://example.com/hook';
      const config = { onOrderCreated: url } as any;
      const postMock = jest
        .fn()
        .mockReturnValue(of({ status: 200, data: { success: true } }));
      httpService.post = postMock;

      await service.callHook('onOrderCreated', { order, merchant }, config);

      expect(postMock).toHaveBeenCalledWith(url, expect.any(Object), {
        timeout: 5000,
      });
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'INTEGRATION_INITIATED' }),
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'INTEGRATION_PROCESSING' }),
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'INTEGRATION_COMPLETED' }),
      );
    });

    it('should log warning if URL is missing and skip execution', async () => {
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');
      const config = {} as any;

      await service.callHook('onOrderCreated', { order, merchant }, config);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'onOrderCreated: Configuração de URL ausente',
      );
      expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('should dispatch failure and log error on axios error', async () => {
      const url = 'https://example.com/fail';
      const config = { onOrderCreated: url } as any;
      const error = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
      } as AxiosError;

      httpService.post = jest.fn(() => throwError(() => error));

      await service.callHook('onOrderCreated', { order, merchant }, config);

      expect(dispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'INTEGRATION_FAILED' }),
      );
    });

    it('should dispatch failure and log error on non-axios error', async () => {
      const url = 'https://example.com/fail';
      const config = { onOrderCreated: url } as any;
      httpService.post = jest.fn(() => {
        throw new Error('Generic failure');
      });

      await service.callHook('onOrderCreated', { order, merchant }, config);

      expect(dispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'INTEGRATION_FAILED' }),
      );
    });
  });

  describe('lifecycle hooks', () => {
    const config = {
      onOrderCreated: 'https://example.com/created',
      onOrderUpdated: 'https://example.com/updated',
      onOrderCanceled: 'https://example.com/canceled',
    } as any;

    it('should trigger onOrderCreated and callHook with correct type', async () => {
      const callHookSpy = jest.spyOn(service, 'callHook');
      await service.onOrderCreated({ order, merchant }, config);
      expect(callHookSpy).toHaveBeenCalledWith(
        'onOrderCreated',
        { order, merchant },
        config,
      );
    });

    it('should trigger onOrderUpdated and callHook with correct type', async () => {
      const callHookSpy = jest.spyOn(service, 'callHook');
      await service.onOrderUpdated?.({ order, merchant }, config);
      expect(callHookSpy).toHaveBeenCalledWith(
        'onOrderUpdated',
        { order, merchant },
        config,
      );
    });

    it('should trigger onOrderCanceled and callHook with correct type', async () => {
      const callHookSpy = jest.spyOn(service, 'callHook');
      await service.onOrderCanceled?.({ order, merchant }, config);
      expect(callHookSpy).toHaveBeenCalledWith(
        'onOrderCanceled',
        { order, merchant },
        config,
      );
    });
  });
});
