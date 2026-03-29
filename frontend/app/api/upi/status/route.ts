// GET /api/upi/status?paymentId=xxx — polls UPI payment status
import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/server/backendUrl';

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('paymentId');
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
  }
  const backend = getServerBackendUrl();
  const res = await fetch(`${backend}/api/payments/upi/status/${encodeURIComponent(paymentId)}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
