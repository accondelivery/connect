import { IntegrationPayload } from '../types';

export class InvalidPayloadException extends Error {
  constructor(
    message: string,
    private readonly field?: keyof IntegrationPayload,
  ) {
    super(message);
  }
}
