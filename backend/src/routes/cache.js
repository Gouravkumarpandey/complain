import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  getCacheStats, 
  flushAllCache, 
  invalidateAnalyticsCache, 
  invalidateComplaintCache 
} from '../services/cacheService.js';
import { isRedisConnected } from '../config/redis.js';

const router = express.Router();

/**
 * @route   GET /api/admin/cache/status
 * @desc    Get cache status and statistics
 * @access  Private (Admin only)
 */
router.get('/cache/status', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const connected = isRedisConnected();
  const stats = await getCacheStats();
  
  res.json({
    success: true,
    cache: {
      enabled: connected,
      status: connected ? 'connected' : 'disconnected',
      stats
    }
  });
}));

/**
 * @route   POST /api/admin/cache/flush
 * @desc    Flush all cache
 * @access  Private (Admin only)
 */
router.post('/cache/flush', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await flushAllCache();
  
  res.json({
    success: result,
    message: result ? 'All cache flushed successfully' : 'Failed to flush cache or Redis not connected'
  });
}));

/**
 * @route   POST /api/admin/cache/invalidate/analytics
 * @desc    Invalidate analytics cache
 * @access  Private (Admin only)
 */
router.post('/cache/invalidate/analytics', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await invalidateAnalyticsCache();
  
  res.json({
    success: result,
    message: result ? 'Analytics cache invalidated' : 'Failed to invalidate cache or Redis not connected'
  });
}));

/**
 * @route   POST /api/admin/cache/invalidate/complaints
 * @desc    Invalidate complaints cache
 * @access  Private (Admin only)
 */
router.post('/cache/invalidate/complaints', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await invalidateComplaintCache();
  
  res.json({
    success: result,
    message: result ? 'Complaints cache invalidated' : 'Failed to invalidate cache or Redis not connected'
  });
}));

export default router;
