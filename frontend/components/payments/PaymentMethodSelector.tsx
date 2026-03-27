'use client';
// Top-level checkout payment component
// Shows UPI (India default), Cards, NetBanking, Wallets, and Stripe (international)

import { useState } from 'react';
import UpiAppSelector from './upi/UpiAppSelector';
import { UpiApp } from '@zyloshipping/shared';

type Method = 'upi' | 'card' | 'netbanking' | 'wallet' | 'stripe';

interface Props {
  amount: number;
  orderId: string;
  onPaymentComplete: (paymentId: string) => void;
}

export default function PaymentMethodSelector({ amount, orderId, onPaymentComplete }: Props) {
  const [method, setMethod] = useState<Method>('upi'); // UPI default for Indian users

  const handleUpiSelect = async (app: UpiApp, vpa?: string) => {
    // Calls /api/upi/create-order then opens Razorpay with method: 'upi'
    console.log('UPI pay', { app, vpa, amount, orderId });
    // Full Razorpay checkout integration goes here
  };

  return (
    <div className="space-y-4">
      {/* Method tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['upi', 'card', 'netbanking', 'wallet', 'stripe'] as Method[]).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              method === m
                ? 'bg-brand-accent text-white border-brand-accent'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {m === 'upi' ? 'UPI' : m === 'netbanking' ? 'Net Banking' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Method panels */}
      {method === 'upi'        && <UpiAppSelector onSelect={handleUpiSelect} />}
      {method === 'card'       && <div className="p-4 border rounded-xl text-sm text-gray-500">Razorpay card form loads here</div>}
      {method === 'netbanking' && <div className="p-4 border rounded-xl text-sm text-gray-500">Net banking bank list loads here</div>}
      {method === 'wallet'     && <div className="p-4 border rounded-xl text-sm text-gray-500">Wallet options load here</div>}
      {method === 'stripe'     && <div className="p-4 border rounded-xl text-sm text-gray-500">Stripe Elements load here (international)</div>}
    </div>
  );
}
