import { Router } from 'express';
import { handleRazorpayWebhook } from '../payments/razorpay/razorpay.webhook';
import { handleStripeWebhook }   from '../payments/stripe/stripe.webhook';
import { handleAftershipWebhook } from '../utils/aftership';

const router = Router();

// Signatures are verified inside each handler before any processing
router.post('/razorpay',  handleRazorpayWebhook);
router.post('/stripe',    handleStripeWebhook);
router.post('/aftership', handleAftershipWebhook);

export default router;
