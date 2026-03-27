import { Router } from 'express';
import {
  createUpiOrder,
  verifyUpiPayment,
  getUpiPaymentStatus,
  generateUpiQr,
} from '../payments/upi/upi.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All UPI flows go through Razorpay — these are thin wrappers that
// pre-configure the Razorpay order/payment for UPI method

router.post('/create-order', authMiddleware, createUpiOrder);       // Create Razorpay order for UPI
router.post('/verify',       authMiddleware, verifyUpiPayment);     // Verify HMAC signature
router.get('/status/:paymentId', authMiddleware, getUpiPaymentStatus); // Poll status
router.post('/qr',           authMiddleware, generateUpiQr);        // Generate QR code image

export default router;
