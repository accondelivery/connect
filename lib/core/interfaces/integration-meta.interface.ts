import { JSONSchema } from 'json-schema-to-ts';
import { IntegrationType } from '../types/integration-type.type';

export interface IntegrationMeta {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  description: string;
  type: IntegrationType;
  configSchema: JSONSchema;
}
