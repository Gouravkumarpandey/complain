import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;
let connectionAttempted = false;

/**
 * Initialize Redis connection
 * Falls back gracefully if Redis is not available
 */
const connectRedis = async () => {
  // Only attempt connection once
  if (connectionAttempted) {
    return null;
  }
  connectionAttempted = true;

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000, // 3 second timeout
        reconnectStrategy: (retries) => {
          if (retries > 1) {
            // Stop reconnecting after 2 attempts - Redis is likely not installed
            return false;
          }
          return 1000; // Try once more after 1 second
        }
      }
    });

    // Suppress repeated error logs
    redisClient.on('error', () => {
      // Silent - we'll handle this gracefully
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Connected - Caching enabled');
      isConnected = true;
    });

    redisClient.on('end', () => {
      isConnected = false;
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    isConnected = true;
    
    return redisClient;
  } catch (error) {
    console.log('ℹ️  Redis not available - Running without cache (this is fine)');
    isConnected = false;
    redisClient = null;
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
