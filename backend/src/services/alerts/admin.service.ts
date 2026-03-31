import { Resend } from 'resend';
import { prisma } from '../../db/prisma';
import { redis, KEYS } from '../../utils/redis';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface AdminAlert {
  type: 'SERVICE_FAILURE' | 'PAYMENT_FAILURE' | 'SUPPLIER_FAILURE' | 'CRITICAL_ERROR';
  service: string;
  message: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Send admin alert with spam prevention (30-min cooldown)
 */
export async function sendAdminAlert(alert: AdminAlert): Promise<void> {
  const cooldownKey = `${KEYS.ADMIN_ALERT_COOLDOWN}:${alert.service}`;
  
  // Check cooldown (30 minutes)
  if (redis) {
    const lastAlert = await redis.get(cooldownKey);
    if (lastAlert) {
      console.log(`[Admin Alert] Cooldown active for ${alert.service}, skipping alert`);
      return;
    }
  }

  try {
    // Log to AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'system.alert',
        resource: alert.service,
        resourceId: null,
        ipAddress: null,
        metaJson: {
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          details: alert.details,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Send email notification to admins
    if (resend) {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'OWNER'] }, isActive: true },
        select: { email: true, name: true },
      });

      if (admins.length > 0) {
        const severityEmoji = {
          LOW: '⚠️',
          MEDIUM: '🟡',
          HIGH: '🔴',
          CRITICAL: '🚨',
        };

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f44336; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .alert-box { background: white; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }
              .details { background: #fff; padding: 10px; border-radius: 4px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${severityEmoji[alert.severity]} System Alert - ${alert.severity}</h2>
              </div>
              <div class="content">
                <div class="alert-box">
                  <h3>${alert.type.replace(/_/g, ' ')}</h3>
                  <p><strong>Service:</strong> ${alert.service}</p>
                  <p><strong>Message:</strong> ${alert.message}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                ${alert.details ? `
                  <div class="details">
                    <h4>Details:</h4>
                    <pre>${JSON.stringify(alert.details, null, 2)}</pre>
                  </div>
                ` : ''}
                <p style="margin-top: 20px;">
                  <strong>Action Required:</strong> Please check the admin dashboard and logs for more information.
                </p>
              </div>
              <div class="footer">
                <p>ZyloShipping Admin Alert System</p>
                <p>This is an automated message. Do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        for (const admin of admins) {
          try {
            await resend.emails.send({
              from: 'ZyloShipping Alerts <alerts@zyloshipping.com>',
              to: admin.email,
              subject: `${severityEmoji[alert.severity]} ${alert.severity} Alert: ${alert.service}`,
              html,
            });
          } catch (emailError) {
            console.error(`[Admin Alert] Failed to send email to ${admin.email}:`, emailError);
          }
        }

        console.log(`[Admin Alert] Sent ${alert.severity} alert for ${alert.service} to ${admins.length} admins`);
      }
    }

    // Set cooldown (30 minutes)
    if (redis) {
      await redis.setex(cooldownKey, 30 * 60, Date.now().toString());
    }
  } catch (error) {
    console.error('[Admin Alert] Failed to send alert:', error);
  }
}

/**
 * Send payment failure alert
 */
export async function sendPaymentFailureAlert(orderId: string, reason: string): Promise<void> {
  await sendAdminAlert({
    type: 'PAYMENT_FAILURE',
    service: 'Payment Gateway',
    message: `Payment failed for order ${orderId}`,
    details: { orderId, reason },
    severity: 'HIGH',
  });
}

/**
 * Send supplier failure alert
 */
export async function sendSupplierFailureAlert(supplierId: string, reason: string): Promise<void> {
  await sendAdminAlert({
    type: 'SUPPLIER_FAILURE',
    service: `Supplier: ${supplierId}`,
    message: `Supplier integration failed`,
    details: { supplierId, reason },
    severity: 'HIGH',
  });
}

/**
 * Send critical error alert
 */
export async function sendCriticalErrorAlert(service: string, error: Error): Promise<void> {
  await sendAdminAlert({
    type: 'CRITICAL_ERROR',
    service,
    message: error.message,
    details: {
      stack: error.stack,
      name: error.name,
    },
    severity: 'CRITICAL',
  });
}
