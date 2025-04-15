import { Test, TestingModule } from '@nestjs/testing';
import { EventsService, Order, InvalidOrderException } from '@lib/core';
import { AxiosResponse } from 'axios';
import { FoodyOrderOutput } from './foody.order-output';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

describe('FoodyOutputOrder', () => {
  let service: FoodyOrderOutput;
  let httpService: HttpService;
  let eventsService: EventsService;
  const dispatchMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodyOrderOutput,
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

    service = module.get(FoodyOrderOutput);
    httpService = module.get(HttpService);
    eventsService = module.get(EventsService);

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ignore non-DELIVERY orders', async () => {
    const order = { type: 'TAKEOUT' } as Order;
    await service.onOrderCreated(order, { authorizationToken: 'abc' });
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('should send request to Foody and dispatch success event', async () => {
    const order = {
      id: '123',
      type: 'DELIVERY',
      createdAt: new Date(),
      total: { orderAmount: { value: 1000 } },
      delivery: {
        deliveryAddress: {
          formattedAddress: 'Rua A',
          street: 'Rua A',
          number: '10',
          city: 'Cidade',
          complement: '',
          district: 'Centro',
          postalCode: '74000000',
          coordinates: { latitude: -16, longitude: -49 },
        },
      },
      customer: { name: 'Cliente', phone: { number: '62999999999' } },
      payments: { prepaid: true, pending: 0, methods: [] },
      otherFees: [],
    } as unknown as Order;

    const response = { data: { success: true } } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(response));

    await service.onOrderCreated(order, { authorizationToken: 'token' });

    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_INITIATED',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_PROCESSING',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_COMPLETED',
      metadata: { data: response.data },
    });
  });

  it('should handle missing delivery address', async () => {
    const order = {
      id: '123',
      type: 'DELIVERY',
      delivery: null,
    } as unknown as Order;

    await service.onOrderCreated(order, { authorizationToken: 'token' });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'INTEGRATION_FAILED',
        metadata: {
          error: expect.any(InvalidOrderException),
        },
      }),
    );
  });

  it('should handle axios error', async () => {
    const order = {
      id: '1',
      type: 'DELIVERY',
      createdAt: new Date(),
      total: { orderAmount: { value: 1000 } },
      delivery: {
        deliveryAddress: {
          formattedAddress: '',
          street: '',
          number: '',
          city: '',
          complement: '',
          district: '',
          postalCode: '12345-678',
          coordinates: { latitude: 0, longitude: 0 },
        },
      },
      customer: { name: '', phone: { number: '12345' } },
      payments: { prepaid: true, pending: 0, methods: [] },
      otherFees: [],
    } as unknown as Order;

    const errorResponse = { data: 'error' };
    const axiosError = {
      isAxiosError: true,
      response: errorResponse,
    };

    jest
      .spyOn(httpService, 'post')
      .mockReturnValueOnce(throwError(() => axiosError));

    await service.onOrderCreated(order, { authorizationToken: 'token' });

    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_INITIATED',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_PROCESSING',
    });
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'INTEGRATION_FAILED',
        metadata: {
          error: errorResponse.data,
        },
      }),
    );
  });

  it('should handle order created event properly', async () => {
    const order = {
      id: '456',
      type: 'DELIVERY',
      createdAt: new Date(),
      total: { orderAmount: { value: 1500 } },
      delivery: {
        deliveryAddress: {
          formattedAddress: 'Rua B',
          street: 'Rua B',
          number: '20',
          city: 'Cidade B',
          complement: '',
          district: 'Centro B',
          postalCode: '74000001',
          coordinates: { latitude: -17, longitude: -50 },
        },
      },
      customer: { name: 'Cliente B', phone: { number: '62988888888' } },
      payments: { prepaid: true, pending: 0, methods: [] },
      otherFees: [],
    } as unknown as Order;

    const response = { data: { success: true } } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(response));

    await service.onOrderCreated(order, { authorizationToken: 'token' });

    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_INITIATED',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_PROCESSING',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      eventType: 'INTEGRATION_COMPLETED',
      metadata: { data: response.data },
    });
  });

  describe('transformPayment', () => {
    it('should return "online" for prepaid with no pending', () => {
      const order = {
        payments: {
          prepaid: 10,
          pending: 0,
          methods: [],
        },
      } as unknown as Order;

      expect(service.transformPayment(order)).toBe('online');
    });

    it('should return correct method mapping', () => {
      const testCases: [string, ReturnType<typeof service.transformPayment>][] =
        [
          ['CASH', 'money'],
          ['DEBIT', 'card'],
          ['MEAL_VOUCHER', 'card'],
          ['FOOD_VOUCHER', 'card'],
          ['CREDIT_DEBIT', 'card'],
          ['COUPON', 'card'],
          ['REDEEM', 'card'],
          ['PREPAID_REDEEM', 'card'],
          ['OTHER', 'card'],
          ['CREDIT', 'card'],
          ['DIGITAL_WALLET', 'e_wallet'],
          ['PIX', 'pix'],
        ];

      for (const [method, expected] of testCases) {
        const order = {
          payments: {
            prepaid: false,
            pending: 100,
            methods: [{ method }],
          },
        } as unknown as Order;

        expect(service.transformPayment(order)).toBe(expected);
      }
    });

    it('should return "card" and log warning for unknown method', () => {
      const spy = jest.spyOn(service['logger'], 'warn').mockImplementation();

      const order = {
        payments: {
          prepaid: false,
          pending: 0,
          methods: [{ method: 'UNKNOWN' }],
        },
      } as unknown as Order;

      expect(service.transformPayment(order)).toBe('card');
      expect(spy).toHaveBeenCalledWith(
        `Não foi possível transformar o método de pagamento`,
        order.payments,
      );
    });

    it('should return "card" and log warning if no payment method is provided', () => {
      const spy = jest.spyOn(service['logger'], 'warn').mockImplementation();

      const order = {
        payments: {
          prepaid: false,
          pending: 0,
          methods: [],
        },
      } as unknown as Order;

      expect(service.transformPayment(order)).toBe('card');
      expect(spy).toHaveBeenCalledWith(
        `Não foi possível transformar o método de pagamento`,
        order.payments,
      );
    });
  });

  describe('transformOrder', () => {
    it('should throw InvalidOrderException if delivery is missing', () => {
      const order = {
        id: '1',
        delivery: null,
      } as unknown as Order;

      expect(() => service.transformOrder(order)).toThrow(
        InvalidOrderException,
      );
    });

    it('should throw InvalidOrderException if deliveryAddress is missing', () => {
      const order = {
        id: '1',
        delivery: {},
      } as unknown as Order;

      expect(() => service.transformOrder(order)).toThrow(
        InvalidOrderException,
      );
    });

    it('should correctly transform order to CreateFoodyOrderDto', () => {
      const order = {
        id: '789',
        type: 'DELIVERY',
        createdAt: new Date(),
        total: { orderAmount: { value: 5000 } },
        delivery: {
          deliveryAddress: {
            formattedAddress: 'Rua X',
            street: 'Rua X',
            number: '100',
            city: 'Cidade X',
            complement: 'Apto 1',
            district: 'Bairro X',
            postalCode: '74000-000',
            coordinates: { latitude: -16.5, longitude: -49.3 },
          },
        },
        customer: { name: 'Fulano', phone: { number: '62999999999' } },
        payments: { prepaid: true, pending: 0, methods: [] },
        otherFees: [{ type: 'SERVICE_FEE', price: { value: 500 } }],
      } as unknown as Order;

      const result = service.transformOrder(order);

      expect(result).toMatchObject({
        id: '789',
        status: 'open',
        deliveryFee: 500,
        paymentMethod: 'online',
        deliveryPoint: {
          address: 'Rua X',
          street: 'Rua X',
          houseNumber: '100',
          city: 'Cidade X',
          complement: 'Apto 1',
          region: 'Bairro X',
          postalCode: '74000000',
          country: 'BR',
          coordinates: {
            lat: -16.5,
            lng: -49.3,
          },
        },
        date: order.createdAt,
        customer: {
          customerName: 'Fulano',
          customerPhone: '+5562999999999',
        },
        orderTotal: 5000,
      });
    });
  });
});
