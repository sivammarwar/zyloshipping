import { prisma } from '../db/prisma';

/**
 * Send abandoned cart email
 * Called 2 hours after cart is created without checkout
 */
export async function runAbandonedCartJob(userId: string, cartId: string): Promise<void> {
  try {
    // Check if cart still exists and has items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      console.log(`[abandonedCart] Cart ${cartId} is empty or doesn't exist`);
      return;
    }

    // Check if user has already checked out
    const recentOrder = await prisma.order.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
        },
      },
    });

    if (recentOrder) {
      console.log(`[abandonedCart] User ${userId} already checked out`);
      return;
    }

    // TODO: Send abandoned cart email when RESEND_API_KEY is configured
    // const emailData = {
    //   to: cart.user.email,
    //   subject: 'You left something behind!',
    //   items: cart.items.map(item => ({
    //     name: item.product.title,
    //     image: item.product.imagesJson?.[0],
    //     price: item.product.price,
    //     quantity: item.quantity,
    //   })),
    //   discountCode: 'COMEBACK10',
    //   cartUrl: `${process.env.FRONTEND_URL}/cart`,
    // };
    // await sendAbandonedCartEmail(emailData);

    console.log(`[abandonedCart] Would send email to ${cart.user.email} for cart ${cartId}`);
    console.log(`[abandonedCart] Cart has ${cart.items.length} items`);
  } catch (error) {
    console.error('[abandonedCart] Error processing abandoned cart:', error);
  }
}
