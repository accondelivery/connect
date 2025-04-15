import { FromSchema, JSONSchema } from 'json-schema-to-ts';

export const FOODY_CONFIG_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Foody Delivery Configuration',
  type: 'object',
  properties: {
    authorizationToken: {
      type: 'string',
      title: 'Token de autorização',
      description:
        "Token de autorização a ser enviado no header 'Authorization'",
    },
  },
  required: ['authorizationToken'],
} as const satisfies JSONSchema;

export type FoodyConfig = FromSchema<typeof FOODY_CONFIG_SCHEMA>;
