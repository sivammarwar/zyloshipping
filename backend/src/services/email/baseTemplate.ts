export interface EmailTemplateData {
  subject: string;
  preheader?: string;
  heading: string;
  content: string;
}

export function createBaseEmailTemplate(data: EmailTemplateData): string {
  const { subject, preheader, heading, content } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f5f5f5;
      padding: 20px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #1A1A1A;
      padding: 30px 40px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .logo-accent {
      color: #E53E3E;
    }
    .email-body {
      padding: 40px;
      color: #333333;
      line-height: 1.6;
    }
    .email-heading {
      font-size: 24px;
      font-weight: 600;
      color: #1A1A1A;
      margin: 0 0 20px 0;
    }
    .email-content {
      font-size: 16px;
      color: #555555;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #E53E3E;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 10px 0;
      transition: background-color 0.3s ease;
    }
    .button:hover {
      background-color: #C53030;
    }
    .email-footer {
      background-color: #f9f9f9;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    .footer-text {
      font-size: 14px;
      color: #888888;
      margin: 5px 0;
    }
    .footer-links {
      margin: 15px 0;
    }
    .footer-link {
      color: #E53E3E;
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .social-links {
      margin: 20px 0 10px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 8px;
      color: #888888;
      text-decoration: none;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        border-radius: 0;
      }
      .email-header,
      .email-body,
      .email-footer {
        padding: 20px;
      }
      .email-heading {
        font-size: 20px;
      }
      .button {
        display: block;
        width: 100%;
        box-sizing: border-box;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}" class="logo">
          Zylo<span class="logo-accent">Shipping</span>
        </a>
      </div>
      
      <div class="email-body">
        <h1 class="email-heading">${heading}</h1>
        <div class="email-content">
          ${content}
        </div>
      </div>
      
      <div class="email-footer">
        <p class="footer-text">
          Need help? Contact us at 
          <a href="mailto:support@zyloshipping.com" class="footer-link">support@zyloshipping.com</a>
        </p>
        
        <div class="footer-links">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/orders" class="footer-link">Track Orders</a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/support" class="footer-link">Support</a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/returns" class="footer-link">Returns</a>
        </div>
        
        <div class="social-links">
          <a href="#" class="social-link">Twitter</a>
          <a href="#" class="social-link">Instagram</a>
          <a href="#" class="social-link">Facebook</a>
        </div>
        
        <p class="footer-text" style="margin-top: 20px;">
          © ${new Date().getFullYear()} ZyloShipping. All rights reserved.
        </p>
        
        <p class="footer-text">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com'}/unsubscribe" class="footer-link" style="font-size: 12px;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
