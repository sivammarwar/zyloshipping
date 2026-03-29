const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

async function sendTwilio(to: string, body: string): Promise<void> {
  if (!sid || !token || !fromNumber) {
    console.warn('[sms] Twilio not configured — message:', body.slice(0, 80));
    return;
  }
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Twilio ${res.status}: ${t}`);
  }
}

export async function sendShippedSms(phone: string, orderNumber: string, trackingUrl: string) {
  await sendTwilio(phone, `ZyloShipping: Order ${orderNumber} shipped. Track: ${trackingUrl}`);
}

export async function sendOutForDeliverySms(phone: string, orderNumber: string) {
  await sendTwilio(phone, `ZyloShipping: Order ${orderNumber} is out for delivery today.`);
}

export async function sendDeliveredSms(phone: string, orderNumber: string) {
  await sendTwilio(phone, `ZyloShipping: Order ${orderNumber} has been delivered. Thank you!`);
}
