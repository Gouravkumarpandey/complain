// Database connection state manager
let DB_HEALTH = {
  isConnected: false,
  lastCheck: null,
  lastError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  checkInterval: 30000 // 30 seconds
};

// Database check middleware
const dbConnectionCheck = async (req, res, next) => {
  // Skip check for non-API routes and health check routes
  if (!req.path.startsWith('/api') || req.path === '/api/health') {
    return next();
  }

  // Skip DB check for auth routes that should work during cold starts
  // These routes handle their own DB errors gracefully
  const skipDbCheckRoutes = [
    '/api/auth/logout',
    '/api/auth/google',
    '/api/auth/google-decode',
    '/api/auth/google-signup',
    '/api/auth/facebook',
    '/api/auth/facebook-signup',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/admin-login',
    '/api/auth/refresh'
  ];
  
  if (skipDbCheckRoutes.some(route => req.path === route)) {
    return next();
  }
  
  const now = Date.now();
  
  // Only perform actual DB check if enough time has passed since last check
  if (!DB_HEALTH.lastCheck || (now - DB_HEALTH.lastCheck > DB_HEALTH.checkInterval)) {
    try {
      const mongoose = (await import('mongoose')).default;
      const isConnected = mongoose.connection.readyState === 1;
      
      // Update health status
      DB_HEALTH.isConnected = isConnected;
      DB_HEALTH.lastCheck = now;
      
      if (isConnected) {
        DB_HEALTH.lastError = null;
        DB_HEALTH.reconnectAttempts = 0;
      } else {
        throw new Error('Database connection lost');
      }
    } catch (error) {
      DB_HEALTH.isConnected = false;
      DB_HEALTH.lastError = error.message;
      
      console.error('Database health check failed:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        reconnectAttempts: DB_HEALTH.reconnectAttempts,
        maxAttempts: DB_HEALTH.maxReconnectAttempts
      });
      
      // Attempt reconnection if not exceeded max attempts
      if (DB_HEALTH.reconnectAttempts < DB_HEALTH.maxReconnectAttempts) {
        DB_HEALTH.reconnectAttempts++;
        
        // Try to reconnect asynchronously
        try {
          const connectDB = (await import('../config/db.js')).default;
          connectDB().then(() => {
            DB_HEALTH.isConnected = true;
            DB_HEALTH.lastError = null;
            console.log('Database reconnection successful');
          }).catch(err => {
            console.error('Database reconnection failed:', err.message);
          });
        } catch (err) {
          console.error('Failed to import database connection module:', err);
        }
      }
    }
  }
  
  // Return error response if database is not available
  if (!DB_HEALTH.isConnected) {
    const statusCode = DB_HEALTH.reconnectAttempts >= DB_HEALTH.maxReconnectAttempts ? 500 : 503;
    
    return res.status(statusCode).json({
      error: 'Database Error',
      message: 'The database is currently unavailable',
      code: 'DB_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        lastError: DB_HEALTH.lastError,
        reconnectAttempts: DB_HEALTH.reconnectAttempts,
        maxAttempts: DB_HEALTH.maxReconnectAttempts,
        retryAfter: Math.ceil((DB_HEALTH.lastCheck + DB_HEALTH.checkInterval - now) / 1000)
      } : undefined,
      retryAfter: Math.ceil((DB_HEALTH.lastCheck + DB_HEALTH.checkInterval - now) / 1000)
    });
  }
  
  next();
};

export { dbConnectionCheck };