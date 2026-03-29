// POST /api/upi/create-order
// Creates a Razorpay order pre-configured for UPI method
import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/server/backendUrl';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const backend = getServerBackendUrl();
  const res = await fetch(`${backend}/api/payments/upi/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
