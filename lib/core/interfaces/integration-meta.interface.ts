import { JSONSchema } from 'json-schema-to-ts';

export interface IntegrationMeta {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  description: string;
  configSchema: JSONSchema;
}
