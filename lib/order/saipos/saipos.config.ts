import { FromSchema, JSONSchema } from 'json-schema-to-ts';

export const SAIPOS_CONFIG_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Saipos Configuration',
  type: 'object',
  properties: {
    idPartner: {
      type: 'string',
      title: 'Id Partner',
      description:
        'Identificador da loja com a integração. Solicite ao suporte Saipos',
    },
  },
  required: ['idPartner'],
} as const satisfies JSONSchema;

export type SaiposConfig = FromSchema<typeof SAIPOS_CONFIG_SCHEMA>;
