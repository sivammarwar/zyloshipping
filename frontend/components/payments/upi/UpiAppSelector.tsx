'use client';
// Renders UPI app buttons: GPay, PhonePe, Paytm, BHIM + manual VPA input
// Triggers Razorpay checkout pre-set to method: 'upi'

import { useState } from 'react';
import { UpiApp } from '@zyloshipping/shared';

const UPI_APPS: { id: UpiApp; label: string; color: string }[] = [
  { id: 'gpay',    label: 'Google Pay', color: '#4285F4' },
  { id: 'phonepe', label: 'PhonePe',    color: '#5F259F' },
  { id: 'paytm',   label: 'Paytm',      color: '#002970' },
  { id: 'bhim',    label: 'BHIM',       color: '#00529B' },
];

interface Props { onSelect: (app: UpiApp, vpa?: string) => void; }

export default function UpiAppSelector({ onSelect }: Props) {
  const [vpa, setVpa]         = useState('');
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {UPI_APPS.map(app => (
          <button
            key={app.id}
            onClick={() => onSelect(app.id)}
            className="flex items-center gap-2 p-3 border rounded-xl hover:border-brand-accent transition-colors font-medium text-sm"
          >
            <span className="w-6 h-6 rounded-full" style={{ background: app.color }} />
            {app.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setManualOpen(v => !v)}
        className="text-sm text-brand-accent underline"
      >
        Pay with UPI ID / VPA
      </button>
      {manualOpen && (
        <div className="flex gap-2">
          <input
            value={vpa}
            onChange={e => setVpa(e.target.value)}
            placeholder="yourname@upi"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => onSelect('other', vpa)}
            className="bg-upi text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Pay
          </button>
        </div>
      )}
    </div>
  );
}
