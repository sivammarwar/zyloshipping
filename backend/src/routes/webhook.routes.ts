import { Router } from 'express';
import { handleRazorpayWebhook } from '../services/payment/razorpay.webhook.handler';
import { handleStripeWebhook } from '../services/payment/stripe.webhook.handler';
import { handleAftershipWebhook } from '../services/tracking/aftership.webhook.handler';
import { webhookLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(webhookLimiter);

router.post('/razorpay', handleRazorpayWebhook);
router.post('/stripe', handleStripeWebhook);
router.post('/aftership', handleAftershipWebhook);

export default router;
