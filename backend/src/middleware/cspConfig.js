/**
 * Content Security Policy Configuration for Render Deployment
 * 
 * This configuration provides a secure CSP for production while allowing
 * necessary external resources (CDN, fonts, auth providers, etc.)
 */

/**
 * Get CSP directives based on environment
 * @param {boolean} isDevelopment - Whether running in development mode
 * @returns {Object} CSP directives configuration
 */
export const getCspDirectives = (isDevelopment = false) => {
  // Get frontend URL from environment
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';

  // Base directives that work for both dev and prod
  const baseDirectives = {
    // Default fallback - only allow same origin
    defaultSrc: ["'self'"],

    // Scripts: Allow self, inline scripts (for Vite), and auth providers
    scriptSrc: [
      "'self'",
      isDevelopment ? "'unsafe-inline'" : "'unsafe-inline'", // Vite needs inline scripts
      isDevelopment ? "'unsafe-eval'" : null, // Only in development
      "https://accounts.google.com",
      "https://apis.google.com",
      "https://connect.facebook.net",
      "https://cdn.jsdelivr.net", // For BeerCSS/Materialize
    ].filter(Boolean),

    // Styles: Allow self, inline styles, and CDN stylesheets
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for React inline styles and Tailwind
      "https://accounts.google.com",
      "https://cdn.jsdelivr.net",
      "https://fonts.googleapis.com",
    ],

    // Fonts: Allow self and common font CDNs
    fontSrc: [
      "'self'",
      "data:", // For inline fonts
      "https://cdn.jsdelivr.net",
      "https://fonts.gstatic.com",
    ],

    // Images: Allow self, data URIs, and HTTPS images
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:", // Allow all HTTPS images (profile pictures, etc.)
      frontendUrl,
      backendUrl,
    ],

    // Connect: API calls, WebSockets, and external APIs
    connectSrc: [
      "'self'",
      frontendUrl,
      backendUrl,
      // WebSocket connections (ws:// for dev, wss:// for prod)
      frontendUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
      backendUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
      "https://accounts.google.com",
      "https://www.googleapis.com",
      "https://graph.facebook.com",
      "https://connect.facebook.net",
      "https://openrouter.ai", // DeepSeek API
      "https://api.stripe.com", // Stripe payments
    ],

    // Frames: Allow embedding from auth providers
    frameSrc: [
      "'self'",
      "https://accounts.google.com",
      "https://www.facebook.com",
      "https://js.stripe.com", // Stripe checkout
    ],

    // Object/Embed: Restrict plugins
    objectSrc: ["'none'"],

    // Base URI: Restrict base tag
    baseUri: ["'self'"],

    // Forms: Allow form submissions to self and auth providers
    formAction: [
      "'self'",
      "https://accounts.google.com",
    ],

    // Frame ancestors: Prevent clickjacking
    frameAncestors: ["'none'"],

    // Upgrade insecure requests in production
    upgradeInsecureRequests: isDevelopment ? null : [],

    // Block mixed content
    blockAllMixedContent: isDevelopment ? null : [],
  };

  // Remove null values
  return Object.fromEntries(
    Object.entries(baseDirectives).filter(([_, value]) => value !== null)
  );
};

/**
 * Manual CSP Middleware (without Helmet)
 * Use this if you want full control over CSP headers
 */
export const cspMiddleware = (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const directives = getCspDirectives(isDevelopment);

  // Convert directives object to CSP header string
  const cspString = Object.entries(directives)
    .map(([key, values]) => {
      // Convert camelCase to kebab-case
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      
      // Handle special directives without values
      if (Array.isArray(values) && values.length === 0) {
        return directive;
      }
      
      // Handle array values
      if (Array.isArray(values)) {
        return `${directive} ${values.join(' ')}`;
      }
      
      return `${directive} ${values}`;
    })
    .join('; ');

  // Set CSP header
  res.setHeader('Content-Security-Policy', cspString);
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Helmet CSP Configuration
 * Use this with helmet middleware for standard setup
 */
export const getHelmetCspConfig = (isDevelopment = false) => {
  return {
    crossOriginEmbedderPolicy: false, // Required for some third-party integrations
    crossOriginOpenerPolicy: false, // Disable COOP to allow OAuth popups
    contentSecurityPolicy: {
      useDefaults: false,
      directives: getCspDirectives(isDevelopment),
    },
    // Additional Helmet security options
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  };
};

/**
 * CSP Report Handler
 * Use this to log CSP violations in production
 */
export const cspReportHandler = (req, res) => {
  const report = req.body;
  
  console.error('CSP Violation Report:', {
    time: new Date().toISOString(),
    documentUri: report['document-uri'],
    violatedDirective: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    originalPolicy: report['original-policy'],
  });
  
  res.status(204).end();
};

/**
 * Development CSP Reporter Middleware
 * Logs CSP violations to console in development
 */
export const devCspReporter = (isDevelopment = false) => {
  if (!isDevelopment) return (req, res, next) => next();

  return (req, res, next) => {
    const originalSetHeader = res.setHeader;
    res.setHeader = function (name, value) {
      if (name.toLowerCase() === 'content-security-policy') {
        // Add report-uri in development to see violations
        value += "; report-uri /api/csp-report";
      }
      return originalSetHeader.apply(this, arguments);
    };
    next();
  };
};

export default {
  getCspDirectives,
  cspMiddleware,
  getHelmetCspConfig,
  cspReportHandler,
  devCspReporter,
};
