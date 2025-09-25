import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { z } from 'zod';

import { Config, EventBus } from '../../../base';
import { Public } from '../../../core/auth';

const RcEventSchema = z
  .object({
    type: z.enum([
      'TEST',
      'INITIAL_PURCHASE',
      'NON_RENEWING_PURCHASE',
      'RENEWAL',
      'PRODUCT_CHANGE',
      'CANCELLATION',
      'BILLING_ISSUE',
      'SUBSCRIBER_ALIAS',
      'SUBSCRIPTION_PAUSED',
      'UNCANCELLATION',
      'TRANSFER',
      'SUBSCRIPTION_EXTENDED',
      'EXPIRATION',
      'TEMPORARY_ENTITLEMENT_GRANT',
      'INVOICE_ISSUANCE',
      'VIRTUAL_CURRENCY_TRANSACTION',
    ]),
    id: z.string(),
    app_id: z.string(),
    environment: z.enum(['PRODUCTION', 'SANDBOX']),

    app_user_id: z.string().optional(),
    store: z.string().optional(),
    is_family_share: z.boolean().nullable().optional(),
    period_type: z
      .enum(['TRIAL', 'INTRO', 'NORMAL', 'PROMOTIONAL', 'PREPAID'])
      .nullable()
      .optional(),
    original_transaction_id: z.string().nullable().optional(),
    transaction_id: z.string().nullable().optional(),
    purchase_token: z.string().nullable().optional(),
  })
  .passthrough();

const RcWebhookPayloadSchema = z.object({ event: RcEventSchema }).passthrough();

export type RcEvent = z.infer<typeof RcEventSchema>;
type RcPayload = z.infer<typeof RcWebhookPayloadSchema>;

@Controller('/api/revenuecat')
export class RevenueCatWebhookController {
  private readonly logger = new Logger(RevenueCatWebhookController.name);

  constructor(
    private readonly config: Config,
    private readonly event: EventBus
  ) {}

  @Public()
  @Post('/webhook')
  async handleWebhook(
    @Body() body: RcPayload,
    @Headers('authorization') authorization?: string
  ) {
    const { enabled, webhookAuth, environment } =
      this.config.payment.revenuecat || {};
    if (enabled) {
      if (webhookAuth && authorization === webhookAuth) {
        try {
          const parsed = RcWebhookPayloadSchema.safeParse(body);
          if (parsed.success) {
            const event = parsed.data.event;
            const { id, app_user_id: appUserId, type } = event;
            if (
              event.environment.toLowerCase() === environment?.toLowerCase()
            ) {
              this.logger.log(
                `[${id}] RevenueCat Webhook {${type}} received for appUserId=${appUserId}.`
              );

              if (
                appUserId &&
                (typeof event.is_family_share !== 'boolean' ||
                  !event.is_family_share)
              ) {
                // immediately ack and process asynchronously
                this.event
                  .emitAsync('revenuecat.webhook', { appUserId, event })
                  .catch((e: Error) => {
                    this.logger.error(
                      'Failed to handle RevenueCat Webhook event.',
                      e
                    );
                  });
              }
            }
          } else {
            this.logger.warn(
              'RevenueCat webhook invalid payload received.',
              parsed.error
            );
          }
        } catch (e) {
          this.logger.error('RevenueCat webhook error', e as Error);
        }
      } else {
        this.logger.warn('RevenueCat webhook unauthorized.');
      }
    }

    return { ok: true };
  }
}
