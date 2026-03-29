import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM_EMAIL || 'ZyloShipping <onboarding@resend.dev>';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    console.warn('[email] Resend not configured — reset link:', resetUrl);
    return { id: 'noop' };
  }
  return resend.emails.send({
    from,
    to,
    subject: 'Reset your ZyloShipping password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Expires in 15 minutes.</p>`,
  });
}

export async function sendAlertEmail(subject: string, body: string) {
  const alertTo = process.env.ALERT_EMAIL;
  if (!resend || !alertTo) {
    console.warn('[email] Alert:', subject, body);
    return;
  }
  await resend.emails.send({ from, to: alertTo, subject, html: `<pre>${body}</pre>` });
}

export async function sendPaymentFailedEmail(to: string, orderNumber: string, detail: string) {
  if (!resend) {
    console.warn('[email] payment failed (no Resend):', to, orderNumber, detail);
    return;
  }
  return resend.emails.send({
    from,
    to,
    subject: `Payment issue — order ${orderNumber}`,
    html: `<p>We could not complete payment for order <strong>${orderNumber}</strong>.</p><p>${detail}</p><p>If you were charged, contact support.</p>`,
  });
}

export async function sendRefundConfirmationEmail(
  to: string,
  orderNumber: string,
  amount: number,
  currency: string
) {
  const { sendRefundConfirmedEmail } = await import('./notification/email.service');
  return sendRefundConfirmedEmail(to, orderNumber, amount.toFixed(2), currency);
}
