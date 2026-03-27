'use client';
// Hook that loads the Razorpay script and exposes openCheckout
// Supports method: 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi'

import { useEffect, useRef } from 'react';
import { toPaise } from '@zyloshipping/shared/utils/currency';

declare global {
  interface Window { Razorpay: any; }
}

interface RazorpayOptions {
  razorpayOrderId: string;
  amount: number;         // in INR
  method?: 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';
  upiApp?: string;        // 'google_pay' | 'phonepe' | 'paytm' | 'bhim'
  vpa?: string;           // UPI ID for collect flow
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onFailure: (error: any) => void;
}

export function useRazorpay() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    const script  = document.createElement('script');
    script.src    = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async  = true;
    script.onload = () => { scriptLoaded.current = true; };
    document.body.appendChild(script);
  }, []);

  const openCheckout = (opts: RazorpayOptions) => {
    const rzp = new window.Razorpay({
      key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount:      toPaise(opts.amount),        // paise
      currency:    'INR',
      order_id:    opts.razorpayOrderId,
      name:        'ZyloShipping',
      description: 'Order Payment',
      image:       '/logos/zyloshipping.png',
      prefill: {
        name:    opts.customerName,
        email:   opts.customerEmail,
        contact: opts.customerPhone,
        // Pre-fill UPI VPA if provided
        ...(opts.vpa ? { vpa: opts.vpa } : {}),
      },
      // Lock to specific method when called from UPI selector
      ...(opts.method ? {
        config: {
          display: {
            blocks: {
              preferred: {
                name: opts.method === 'upi' ? 'Pay via UPI' : opts.method,
                instruments: opts.method === 'upi'
                  ? [
                      { method: 'upi', flows: ['collect', 'intent', 'qr'] },
                    ]
                  : [{ method: opts.method }],
              },
            },
            sequence: ['block.preferred'],
            preferences: { show_default_blocks: false },
          },
        },
      } : {}),
      handler:  opts.onSuccess,
      modal:    { ondismiss: () => opts.onFailure({ reason: 'dismissed' }) },
      theme:    { color: '#6366F1' },
    });
    rzp.on('payment.failed', opts.onFailure);
    rzp.open();
  };

  return { openCheckout };
}
