export interface WebhookInputIntegration<
  B = unknown,
  Q = Record<string, unknown>,
> {
  readonly usesWebhook: true;
  onWebhookData(body: B, queryParams?: Q): Promise<void>;
}
