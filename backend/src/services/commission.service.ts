import { prisma } from '../db/prisma';

interface CommissionCalculation {
  orderId: string;
  revenue: number;
  supplierCost: number;
  gatewayFee: number;
  netCommission: number;
  marginPercent: number;
}

/**
 * Calculate commission for an order
 * Commission = Revenue - Supplier Cost - Gateway Fee
 */
export async function calculateCommission(
  orderId: string,
  gateway: 'razorpay' | 'stripe' = 'razorpay'
): Promise<CommissionCalculation | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
    },
  });

  if (!order) {
    console.error(`[commission] Order ${orderId} not found`);
    return null;
  }

  // Revenue = what customer paid
  const revenue = order.totalAmount;

  // Supplier cost = sum of (supplierCost * quantity) for all items
  const supplierCost = order.items.reduce(
    (sum, item) => sum + item.supplierCost * item.quantity,
    0
  );

  // Gateway fee calculation
  let gatewayFee = 0;
  if (gateway === 'razorpay') {
    // Razorpay: 2% of transaction amount
    gatewayFee = revenue * 0.02;
  } else if (gateway === 'stripe') {
    // Stripe: 2.9% + $0.30 (convert to INR, ~₹25)
    gatewayFee = revenue * 0.029 + 25;
  }

  // Net commission
  const netCommission = revenue - supplierCost - gatewayFee;

  // Margin percentage
  const marginPercent = revenue > 0 ? (netCommission / revenue) * 100 : 0;

  const calculation: CommissionCalculation = {
    orderId,
    revenue,
    supplierCost,
    gatewayFee,
    netCommission,
    marginPercent,
  };

  // Save to Commission table
  try {
    const existing = await prisma.commission.findUnique({
      where: { orderId },
    });

    if (existing) {
      // Update existing commission
      await prisma.commission.update({
        where: { orderId },
        data: {
          amount: netCommission,
          percentage: marginPercent,
          status: 'PENDING',
        },
      });
    } else {
      // Create new commission record
      await prisma.commission.create({
        data: {
          orderId,
          amount: netCommission,
          percentage: marginPercent,
          status: 'PENDING',
        },
      });
    }

    console.log(`[commission] Calculated for order ${orderId}: ₹${netCommission.toFixed(2)} (${marginPercent.toFixed(2)}%)`);
    return calculation;
  } catch (error) {
    console.error('[commission] Error saving commission:', error);
    return calculation;
  }
}

/**
 * Reverse commission when order is refunded
 */
export async function reverseCommission(orderId: string): Promise<void> {
  try {
    const commission = await prisma.commission.findUnique({
      where: { orderId },
    });

    if (!commission) {
      console.warn(`[commission] No commission found for order ${orderId}`);
      return;
    }

    // Update commission status to REFUNDED and set amount to 0
    await prisma.commission.update({
      where: { orderId },
      data: {
        amount: 0,
        status: 'REFUNDED',
      },
    });

    console.log(`[commission] Reversed commission for order ${orderId}`);
  } catch (error) {
    console.error('[commission] Error reversing commission:', error);
  }
}

/**
 * Get total commission for a date range
 */
export async function getTotalCommission(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.commission.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'PENDING',
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount || 0;
}
