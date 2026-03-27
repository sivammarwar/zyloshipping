// POST /api/upi/verify — verifies UPI payment signature after callback
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res  = await fetch(`${process.env.BACKEND_URL}/api/payments/upi/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
