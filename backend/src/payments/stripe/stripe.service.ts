import Stripe     from 'stripe';
import { Request, Response } from 'express';
import { toPaise } from '@zyloshipping/shared/utils/currency';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function createStripePaymentIntent(req: Request, res: Response) {
  try {
    const { amount, orderId } = req.body; // amount in INR
    const intent = await stripe.paymentIntents.create({
      amount:   toPaise(amount),           // Stripe also uses smallest currency unit
      currency: 'inr',
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Stripe payment intent', details: err });
  }
}
