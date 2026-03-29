import { Resend } from 'resend';
import { createBaseEmailTemplate } from './baseTemplate';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface PasswordResetData {
  email: string;
  resetLink: string;
  ipAddress?: string;
}

export async function sendPasswordResetEmail(data: PasswordResetData): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping password reset email');
    return;
  }

  try {
    const timestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });

    const content = `
      <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
        You recently requested to reset your password for your ZyloShipping account. 
        Click the button below to reset it.
      </p>

      <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>⏰ This link expires in 1 hour</strong>
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" class="button">
          Reset Your Password
        </a>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
          Or copy and paste this URL into your browser:
        </p>
        <p style="margin: 0; font-size: 12px; color: #888; word-break: break-all;">
          ${data.resetLink}
        </p>
      </div>

      <div style="background-color: #FFF5F5; border: 1px solid #FED7D7; border-radius: 6px; padding: 20px; margin: 30px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #C53030;">🔒 Security Notice</h4>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555; line-height: 1.6;">
          <strong>If you didn't request this password reset, please ignore this email.</strong> 
          Your password will remain unchanged.
        </p>
        <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
          For your security, never share your password with anyone. ZyloShipping will never ask you 
          for your password via email or phone.
        </p>
      </div>

      ${data.ipAddress ? `
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #888;">
            <strong>Request Details:</strong><br>
            Time: ${timestamp}<br>
            ${data.ipAddress ? `IP Address: ${data.ipAddress}` : ''}
          </p>
        </div>
      ` : ''}

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
        If you're having trouble with the button above, contact our 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" style="color: #E53E3E; text-decoration: none;">support team</a>.
      </p>
    `;

    const html = createBaseEmailTemplate({
      subject: '🔐 Reset Your ZyloShipping Password',
      preheader: 'Click here to reset your password. This link expires in 1 hour.',
      heading: '🔐 Reset Your Password',
      content
    });

    await resend.emails.send({
      from: 'ZyloShipping <orders@zyloshipping.com>',
      to: data.email,
      subject: '🔐 Reset Your ZyloShipping Password',
      html
    });

    console.log(`[Email] Password reset email sent to ${data.email}`);
  } catch (error) {
    console.error(`[Email] Failed to send password reset email to ${data.email}:`, error);
  }
}
