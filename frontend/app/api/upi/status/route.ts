// GET /api/upi/status?paymentId=xxx — polls UPI payment status
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('paymentId');
  const res = await fetch(`${process.env.BACKEND_URL}/api/payments/upi/status/${paymentId}`);
  return NextResponse.json(await res.json());
}
