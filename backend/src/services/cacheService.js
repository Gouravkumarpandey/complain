import { getRedisClient, isRedisConnected } from '../config/redis.js';

// Default cache TTL values (in seconds)
const CACHE_TTL = {
  ANALYTICS_OVERVIEW: 60,      // 1 minute
  ANALYTICS_STATUS: 60,        // 1 minute
  ANALYTICS_CATEGORY: 60,      // 1 minute
  AGENT_PERFORMANCE: 120,      // 2 minutes
  COMPLAINTS_LIST: 30,         // 30 seconds
  COMPLAINT_DETAIL: 60,        // 1 minute
  USER_STATS: 60,              // 1 minute
  DASHBOARD_STATS: 60,         // 1 minute
  TREND_DATA: 300,             // 5 minutes
};

// Cache key prefixes
const CACHE_KEYS = {
  ANALYTICS_OVERVIEW: 'analytics:overview',
  ANALYTICS_STATUS: 'analytics:status',
  ANALYTICS_CATEGORY: 'analytics:category',
  AGENT_PERFORMANCE: 'analytics:agent-performance',
  COMPLAINTS_LIST: 'complaints:list',
  COMPLAINT_DETAIL: 'complaint:detail',
  USER_STATS: 'user:stats',
  DASHBOARD_STATS: 'dashboard:stats',
  TREND_DATA: 'analytics:trend',
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null if not found
 */
const getCache = async (key) => {
  try {
    if (!isRedisConnected()) {
      return null;
    }
    
    const client = getRedisClient();
    const data = await client.get(key);
    
    if (data) {
      console.log(`🎯 Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    
    console.log(`❌ Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 60)
 * @returns {Promise<boolean>} - Success status
 */
const setCache = async (key, data, ttl = 60) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(data));
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error('Cache set error:', error.message);
    return false;
  }
};

/**
 * Delete a specific cache key
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteCache = async (key) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    
    const client = getRedisClient();
    await client.del(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error.message);
    return false;
  }
};

/**
 * Delete all cache keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'analytics:*')
 * @returns {Promise<boolean>} - Success status
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️ Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`);
    }
    
    return true;
  } catch (error) {
    console.error('Cache delete pattern error:', error.message);
    return false;
  }
};

/**
 * Invalidate all analytics caches
 * Call this when complaint data changes
 */
const invalidateAnalyticsCache = async () => {
  try {
    await deleteCachePattern('analytics:*');
    await deleteCachePattern('dashboard:*');
    console.log('🔄 Analytics cache invalidated');
    return true;
  } catch (error) {
    console.error('Analytics cache invalidation error:', error.message);
    return false;
  }
};

/**
 * Invalidate complaint-related caches
 * Call this when a complaint is created, updated, or deleted
 */
const invalidateComplaintCache = async (complaintId = null) => {
  try {
    await deleteCachePattern('complaints:*');
    await deleteCachePattern('user:*');
    
    if (complaintId) {
      await deleteCache(`${CACHE_KEYS.COMPLAINT_DETAIL}:${complaintId}`);
    }
    
    // Also invalidate analytics since complaint changes affect stats
    await invalidateAnalyticsCache();
    
    console.log('🔄 Complaint cache invalidated');
    return true;
  } catch (error) {
    console.error('Complaint cache invalidation error:', error.message);
    return false;
  }
};

/**
 * Generate a cache key with user/role context
 * @param {string} prefix - Key prefix
 * @param {object} context - Context object (userId, role, etc.)
 * @returns {string} - Generated cache key
 */
const generateCacheKey = (prefix, context = {}) => {
  const parts = [prefix];
  
  if (context.userId) parts.push(`user:${context.userId}`);
  if (context.role) parts.push(`role:${context.role}`);
  if (context.page) parts.push(`page:${context.page}`);
  if (context.limit) parts.push(`limit:${context.limit}`);
  if (context.status) parts.push(`status:${context.status}`);
  if (context.category) parts.push(`category:${context.category}`);
  if (context.priority) parts.push(`priority:${context.priority}`);
  if (context.sortBy) parts.push(`sort:${context.sortBy}`);
  if (context.sortOrder) parts.push(`order:${context.sortOrder}`);
  
  return parts.join(':');
};

/**
 * Cache wrapper for async functions
 * Automatically caches the result of a function
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} - Cached or fresh data
 */
const cacheWrapper = async (key, fn, ttl = 60) => {
  // Try to get from cache first
  const cached = await getCache(key);
  if (cached !== null) {
    return cached;
  }
  
  // Execute the function and cache the result
  const result = await fn();
  await setCache(key, result, ttl);
  
  return result;
};

/**
 * Get cache statistics
 * @returns {Promise<object>} - Cache statistics
 */
const getCacheStats = async () => {
  try {
    if (!isRedisConnected()) {
      return { connected: false, message: 'Redis not connected' };
    }
    
    const client = getRedisClient();
    const info = await client.info('stats');
    const dbSize = await client.dbSize();
    
    return {
      connected: true,
      dbSize,
      info: info.split('\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Get cache stats error:', error.message);
    return { connected: false, error: error.message };
  }
};

/**
 * Flush all cache
 * Use with caution - clears all cached data
 */
const flushAllCache = async () => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    
    const client = getRedisClient();
    await client.flushDb();
    console.log('🧹 All cache flushed');
    return true;
  } catch (error) {
    console.error('Flush cache error:', error.message);
    return false;
  }
};

export {
  CACHE_TTL,
  CACHE_KEYS,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  invalidateAnalyticsCache,
  invalidateComplaintCache,
  generateCacheKey,
  cacheWrapper,
  getCacheStats,
  flushAllCache,
};
