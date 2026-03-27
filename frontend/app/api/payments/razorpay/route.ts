// POST /api/payments/razorpay
// Creates a Razorpay Order — works for UPI, Cards, NetBanking, Wallets, EMI
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { orderId, amount } = await req.json();
  // Forward to backend which calls Razorpay SDK
  const res = await fetch(`${process.env.BACKEND_URL}/api/payments/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
