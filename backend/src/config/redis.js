import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 * Falls back gracefully if Redis is not available
 */
const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('⚠️ Redis: Max reconnection attempts reached, operating without cache');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000); // Reconnect after delay
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Connected and Ready');
      isConnected = true;
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis connection closed');
      isConnected = false;
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    isConnected = true;
    
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis connection failed:', error.message);
    console.log('📝 Application will continue without caching');
    isConnected = false;
    return null;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => redisClient;

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => isConnected && redisClient?.isOpen;

/**
 * Disconnect Redis
 */
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    isConnected = false;
  }
};

export { connectRedis, getRedisClient, isRedisConnected, disconnectRedis };
