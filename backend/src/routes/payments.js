import express from 'express';
import {
  getStripeKey,
  createCheckoutSession,
  verifyPayment,
  getPaymentHistory,
  webhookHandler,
  refundPayment,
  getAllPayments
} from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/payments/key
 * @desc    Get Stripe publishable key
 * @access  Public
 */
router.get('/key', getStripeKey);

/**
 * @route   POST /api/payments/create-checkout-session
 * @desc    Create Stripe checkout session for plan purchase
 * @access  Private
 */
router.post('/create-checkout-session', auth, createCheckoutSession);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Stripe payment and upgrade user plan
 * @access  Private
 */
router.post('/verify', auth, verifyPayment);

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history for current user
 * @access  Private
 */
router.get('/history', auth, getPaymentHistory);

/**
 * @route   POST /api/payments/webhook
 * @desc    Stripe webhook endpoint
 * @access  Public (but signature verified)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

/**
 * @route   POST /api/payments/refund
 * @desc    Refund a payment (admin only)
 * @access  Private (Admin)
 */
router.post('/refund', auth, refundPayment);

/**
 * @route   GET /api/payments/all
 * @desc    Get all payments (admin only)
 * @access  Private (Admin)
 */
router.get('/all', auth, getAllPayments);

export default router;
