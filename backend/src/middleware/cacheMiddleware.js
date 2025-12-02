import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../services/cacheService.js';

/**
 * Cache middleware factory
 * Creates middleware that caches API responses
 * 
 * @param {string} keyPrefix - Cache key prefix (e.g., 'analytics:overview')
 * @param {number} ttl - Cache TTL in seconds
 * @param {object} options - Additional options
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (keyPrefix, ttl = 60, options = {}) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on user context and query params
    const context = {
      userId: options.perUser ? req.user?._id?.toString() : null,
      role: options.perRole ? req.user?.role : null,
      ...req.query
    };
    
    const cacheKey = generateCacheKey(keyPrefix, context);

    try {
      // Try to get cached response
      const cachedData = await getCache(cacheKey);
      
      if (cachedData !== null) {
        // Add cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }

      // No cache hit - capture the response
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttl).catch(err => {
            console.error('Cache middleware set error:', err.message);
          });
        }
        
        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Pre-configured cache middleware for analytics overview
 */
const cacheAnalyticsOverview = cacheMiddleware(
  'analytics:overview',
  CACHE_TTL.ANALYTICS_OVERVIEW,
  { perRole: true }
);

/**
 * Pre-configured cache middleware for analytics status distribution
 */
const cacheAnalyticsStatus = cacheMiddleware(
  'analytics:status',
  CACHE_TTL.ANALYTICS_STATUS,
  { perRole: true }
);

/**
 * Pre-configured cache middleware for analytics category distribution
 */
const cacheAnalyticsCategory = cacheMiddleware(
  'analytics:category',
  CACHE_TTL.ANALYTICS_CATEGORY,
  { perRole: true }
);

/**
 * Pre-configured cache middleware for agent performance
 */
const cacheAgentPerformance = cacheMiddleware(
  'analytics:agent-performance',
  CACHE_TTL.AGENT_PERFORMANCE,
  { perRole: false }
);

/**
 * Pre-configured cache middleware for dashboard stats
 */
const cacheDashboardStats = cacheMiddleware(
  'dashboard:stats',
  CACHE_TTL.DASHBOARD_STATS,
  { perUser: true, perRole: true }
);

/**
 * Pre-configured cache middleware for trend data
 */
const cacheTrendData = cacheMiddleware(
  'analytics:trend',
  CACHE_TTL.TREND_DATA,
  { perRole: true }
);

/**
 * Pre-configured cache middleware for complaints list
 */
const cacheComplaintsList = cacheMiddleware(
  'complaints:list',
  CACHE_TTL.COMPLAINTS_LIST,
  { perUser: true, perRole: true }
);

export {
  cacheMiddleware,
  cacheAnalyticsOverview,
  cacheAnalyticsStatus,
  cacheAnalyticsCategory,
  cacheAgentPerformance,
  cacheDashboardStats,
  cacheTrendData,
  cacheComplaintsList,
};
