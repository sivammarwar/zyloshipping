import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimiter.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.post('/razorpay/create-order', authMiddleware, paymentLimiter, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', authMiddleware, paymentLimiter, paymentController.verifyRazorpayPayment);

router.post('/stripe/create-intent', authMiddleware, paymentLimiter, paymentController.createStripeIntent);
router.post('/stripe/confirm', authMiddleware, paymentLimiter, paymentController.confirmStripePayment);
router.get('/stripe/config', authMiddleware, paymentController.getStripePublishableKey);

router.post('/upi/create-order', authMiddleware, paymentLimiter, paymentController.createUpiOrder);
router.post('/upi/verify', authMiddleware, paymentLimiter, paymentController.verifyUpiPayment);
router.get('/upi/status/:paymentId', authMiddleware, paymentController.getUpiPaymentStatus);
router.post('/upi/qr', authMiddleware, paymentController.postUpiQr);
router.post('/upi/register', authMiddleware, paymentController.postUpiRegister);
router.post('/upi/timeout', authMiddleware, paymentController.postUpiTimeout);

router.post('/refund/request', authMiddleware, paymentLimiter, paymentController.postRefundRequest);
router.post('/refund/process', authMiddleware, adminMiddleware, paymentLimiter, paymentController.postRefundProcess);

export default router;
