// Calls /api/upi/verify after Razorpay callback to confirm signature
export async function verifyUpiPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await fetch('/api/upi/verify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
  });
  if (!res.ok) throw new Error('UPI payment verification failed');
  return res.json();
}
