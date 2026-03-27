import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../payments/razorpay/razorpay.service';
import { createStripePaymentIntent }                  from '../payments/stripe/stripe.service';
import { authMiddleware }                              from '../middleware/auth.middleware';

const router = Router();

router.post('/razorpay/create-order', authMiddleware, createRazorpayOrder);
router.post('/razorpay/verify',       authMiddleware, verifyRazorpayPayment);
router.post('/stripe/create-intent',  authMiddleware, createStripePaymentIntent);

export default router;
