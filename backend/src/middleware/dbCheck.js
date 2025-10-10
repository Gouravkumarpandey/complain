// Database check middleware
const dbConnectionCheck = (req, res, next) => {
  // Skip check for non-API routes and health check routes
  if (!req.path.startsWith('/api') || req.path === '/api/health') {
    return next();
  }
  
  // Check if database is connected
  if (!global.DB_CONNECTED) {
    return res.status(503).json({
      error: 'Database Unavailable',
      message: 'The database is currently unavailable. Please try again later.',
      details: 'If you are running in development mode, please make sure your MongoDB Atlas IP whitelist includes your current IP address.'
    });
  }
  
  next();
};

export { dbConnectionCheck };