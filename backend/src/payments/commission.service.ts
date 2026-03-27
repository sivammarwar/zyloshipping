// Calculates and records commission after each successful payment
// net_commission = revenue - supplier_cost - gateway_fee

const RAZORPAY_FEE_PERCENT = 0.02; // 2% standard Razorpay fee
const STRIPE_FEE_PERCENT   = 0.03; // ~3% for international cards

export function calculateCommission(params: {
  revenue:      number;
  supplierCost: number;
  gateway:      'razorpay' | 'stripe';
}) {
  const feeRate   = params.gateway === 'stripe' ? STRIPE_FEE_PERCENT : RAZORPAY_FEE_PERCENT;
  const gatewayFee    = params.revenue * feeRate;
  const netCommission = params.revenue - params.supplierCost - gatewayFee;
  return { gatewayFee, netCommission };
}
