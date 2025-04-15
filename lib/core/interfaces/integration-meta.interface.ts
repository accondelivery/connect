import { JSONSchema } from 'json-schema-to-ts';
import { IntegrationType } from '../types/integration-type.type';
import { IntegrationCategory } from '../types/integration-category.type';

export interface IntegrationMeta {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  description: string;
  type: IntegrationType;
  category: IntegrationCategory;
  configSchema: JSONSchema;
}
