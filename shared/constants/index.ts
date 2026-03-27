export const ORDER_STATUSES = [
  'PENDING', 'PAYMENT_CONFIRMED', 'SUBMITTED_TO_SUPPLIER',
  'SUPPLIER_CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED',
  'COMPLETED', 'REFUND_REQUESTED', 'REFUNDED', 'CANCELLED',
] as const;

// Razorpay UPI method keys
export const UPI_APPS = {
  gpay:    'Google Pay',
  phonepe: 'PhonePe',
  paytm:   'Paytm',
  bhim:    'BHIM',
  other:   'Other UPI',
} as const;

// Currency
export const CURRENCY          = 'INR';
export const CURRENCY_SYMBOL   = '₹';
export const STRIPE_CURRENCY   = 'inr'; // Stripe uses lowercase ISO

// Pricing
export const MARKUP_PERCENT    = 2.5;
export const PRICE_FLOOR       = 99;
export const PRICE_CEILING     = 99999;

// Razorpay: amounts are in paise (1 INR = 100 paise)
export const INR_TO_PAISE      = 100;

// Redis TTLs
export const CART_TTL_SECONDS    = 604800; // 7 days
export const SESSION_TTL_SECONDS = 86400;  // 24 hours
export const PRODUCT_CACHE_TTL   = 3600;   // 1 hour

// Refund window
export const REFUND_WINDOW_DAYS = 7;
