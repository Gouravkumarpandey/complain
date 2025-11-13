import express from 'express';
import {
  getSubscription,
  upgradePlan,
  downgradePlan,
  getPlanFeatures,
  checkFeatureAccess,
  adminSetPlan,
  getSubscriptionStats
} from '../controllers/subscriptionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current user's subscription details
 * @access  Private
 */
router.get('/current', auth, getSubscription);

/**
 * @route   POST /api/subscriptions/upgrade
 * @desc    Upgrade user plan after successful payment
 * @access  Private
 */
router.post('/upgrade', auth, upgradePlan);

/**
 * @route   POST /api/subscriptions/downgrade
 * @desc    Downgrade to free plan
 * @access  Private
 */
router.post('/downgrade', auth, downgradePlan);

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get available plan features and pricing
 * @access  Public
 */
router.get('/plans', getPlanFeatures);

/**
 * @route   GET /api/subscriptions/feature-access
 * @desc    Check if user has access to specific feature
 * @access  Private
 */
router.get('/feature-access', auth, checkFeatureAccess);

/**
 * @route   POST /api/subscriptions/admin/set-plan
 * @desc    Admin endpoint to manually set user plan
 * @access  Private (Admin only)
 */
router.post('/admin/set-plan', auth, adminSetPlan);

/**
 * @route   GET /api/subscriptions/admin/stats
 * @desc    Get subscription statistics
 * @access  Private (Admin only)
 */
router.get('/admin/stats', auth, getSubscriptionStats);

export default router;
