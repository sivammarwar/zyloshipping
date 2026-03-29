// POST /api/payments/razorpay
// Creates a Razorpay Order — works for UPI, Cards, NetBanking, Wallets, EMI
import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/server/backendUrl';

export async function POST(req: NextRequest) {
  const { orderId, amount } = await req.json();
  const backend = getServerBackendUrl();
  const res = await fetch(`${backend}/api/payments/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
