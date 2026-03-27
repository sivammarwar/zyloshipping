// POST /api/upi/create-order
// Creates a Razorpay order pre-configured for UPI method
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res  = await fetch(`${process.env.BACKEND_URL}/api/payments/upi/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
