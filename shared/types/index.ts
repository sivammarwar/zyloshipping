export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'SUBMITTED_TO_SUPPLIER'
  | 'SUPPLIER_CONFIRMED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentGateway = 'razorpay' | 'stripe';
export type PaymentMethod  = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi' | 'stripe_card';
export type UpiApp         = 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'other';
export type SupplierName   = 'aliexpress' | 'cj';

export interface UpiPaymentDetails {
  method: 'upi';
  upiApp?: UpiApp;
  vpa?: string; // e.g. user@okaxis
}

export interface CardPaymentDetails {
  method: 'card' | 'netbanking' | 'wallet' | 'emi';
}

export type PaymentDetails = UpiPaymentDetails | CardPaymentDetails;

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  supplierCost: number;
  stockQuantity: number;
  category: string;
  status: 'active' | 'hidden' | 'draft';
  imagesJson: string[];
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}
