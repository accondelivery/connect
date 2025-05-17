import { FromSchema, JSONSchema } from 'json-schema-to-ts';

export const ACCON_WEBHOOK_CONFIG_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Accon Webhook Configuration',
  type: 'object',
  properties: {
    onCreatedURL: {
      type: 'string',
      title: 'URL Pedido Criado',
      description: 'URL para ser enviado a notificação de novo pedido',
    },
    onUpdatedURL: {
      type: 'string',
      title: 'URL Pedido Atualizado',
      description:
        'URL para ser enviado a notificação de atualização do pedido',
    },
    onCanceledURL: {
      type: 'string',
      title: 'URL Pedido Cancelado',
      description:
        'URL para ser enviado a notificação de cancelamento do pedido',
    },
  },
  required: ['onCreatedURL'],
} as const satisfies JSONSchema;

export type AcconWebhookConfig = FromSchema<typeof ACCON_WEBHOOK_CONFIG_SCHEMA>;
