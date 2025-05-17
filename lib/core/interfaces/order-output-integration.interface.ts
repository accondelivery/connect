import { IntegrationPayload } from '../types';

export interface OrderOutputIntegration<C> {
  onOrderCreated(payload: IntegrationPayload, config: C): Promise<void>;
  onOrderUpdated?(payload: IntegrationPayload, config: C): Promise<void>;
  onOrderCanceled?(payload: IntegrationPayload, config: C): Promise<void>;
}
