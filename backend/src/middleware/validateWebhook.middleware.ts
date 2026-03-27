// Razorpay and Stripe both sign webhooks — always verify before acting
import crypto from 'crypto';

export function verifyRazorpayWebhookSignature(
  body: string, signature: string, secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expected === signature;
}

export function verifyStripeWebhookSignature(
  body: Buffer, signature: string, secret: string,
  stripe: import('stripe').default
) {
  return stripe.webhooks.constructEvent(body, signature, secret);
}
