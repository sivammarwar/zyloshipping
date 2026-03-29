export type PaymentGateway = 'razorpay' | 'stripe';

export interface RazorpayCreateOrderResult {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: 'INR';
  amountPaise: number;
}

export interface StripeCreateIntentResult {
  clientSecret: string | null;
  paymentIntentId: string;
  publishableKey: string;
  amount: number;
  currency: string;
  amountMinorUnits: number;
}

export interface UpiCreateOrderResult {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: 'INR';
  amountPaise: number;
  deepLinks: {
    universal: string;
    googlePay: string;
    phonePe: string;
    paytm: string;
    bhim: string;
  };
  qrPayload: { upiString: string };
}

export interface CommissionBreakdown {
  revenue: number;
  supplierCost: number;
  gatewayFee: number;
  netCommission: number;
  marginPercent: number;
  shippingCost: number;
}
