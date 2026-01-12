/**
 * CSP Configuration Examples
 * 
 * This file shows different ways to implement CSP in your Express app.
 * Choose the approach that best fits your needs.
 */

import express from 'express';
import helmet from 'helmet';
import { 
  getHelmetCspConfig, 
  cspMiddleware, 
  getCspDirectives,
  cspReportHandler 
} from './middleware/cspConfig.js';

const app = express();

// ========================================
// APPROACH 1: Using Helmet (Recommended)
// ========================================
// This is what's currently implemented in server.js

const isDevelopment = process.env.NODE_ENV !== 'production';
app.use(helmet(getHelmetCspConfig(isDevelopment)));

// ========================================
// APPROACH 2: Manual CSP Middleware
// ========================================
// Use this if you want full control without Helmet

// app.use(cspMiddleware);

// ========================================
// APPROACH 3: Custom Inline CSP
// ========================================
// Build CSP string manually for complete control

app.use((req, res, next) => {
  const directives = getCspDirectives(process.env.NODE_ENV !== 'production');
  
  const cspString = Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      
      if (Array.isArray(values) && values.length === 0) {
        return directive;
      }
      
      if (Array.isArray(values)) {
        return `${directive} ${values.join(' ')}`;
      }
      
      return `${directive} ${values}`;
    })
    .join('; ');

  res.setHeader('Content-Security-Policy', cspString);
  next();
});

// ========================================
// APPROACH 4: Per-Route CSP
// ========================================
// Different CSP for different routes

const strictCsp = (req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self'; style-src 'self';"
  );
  next();
};

const relaxedCsp = (req, res, next) => {
  const directives = getCspDirectives(true); // Development mode
  const cspString = Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return Array.isArray(values) ? `${directive} ${values.join(' ')}` : `${directive} ${values}`;
    })
    .join('; ');
  
  res.setHeader('Content-Security-Policy', cspString);
  next();
};

// Apply strict CSP to admin routes
app.use('/api/admin', strictCsp);

// Apply relaxed CSP to public routes
app.use('/api/public', relaxedCsp);

// ========================================
// CSP REPORTING
// ========================================
// Log CSP violations to help debug issues

// Enable JSON body parsing for CSP reports
app.use(express.json({ 
  type: ['application/json', 'application/csp-report'] 
}));

// CSP violation report endpoint
app.post('/api/csp-report', cspReportHandler);

// ========================================
// TESTING CSP IN DEVELOPMENT
// ========================================
// Add report-uri to CSP in development mode

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const existingCsp = res.getHeader('Content-Security-Policy');
    if (existingCsp) {
      res.setHeader('Content-Security-Policy', 
        `${existingCsp}; report-uri /api/csp-report`
      );
    }
    next();
  });
}

// ========================================
// CSP NONCE GENERATION (Advanced)
// ========================================
// For truly strict CSP without 'unsafe-inline'

import crypto from 'crypto';

app.use((req, res, next) => {
  // Generate unique nonce for this request
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  
  // Add nonce to CSP
  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; script-src 'self' 'nonce-${res.locals.cspNonce}'; style-src 'self' 'nonce-${res.locals.cspNonce}';`
  );
  
  next();
});

// In your HTML template:
// <script nonce="<%= cspNonce %>">console.log('Allowed!');</script>

// ========================================
// DYNAMIC CSP BASED ON USER ROLE
// ========================================
// Different CSP for different user types

app.use((req, res, next) => {
  const user = req.user; // Assume user is attached by auth middleware
  
  if (user?.role === 'admin') {
    // Stricter CSP for admins
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; script-src 'self'; style-src 'self';"
    );
  } else {
    // Normal CSP for regular users
    const directives = getCspDirectives(process.env.NODE_ENV !== 'production');
    // ... set CSP
  }
  
  next();
});

// ========================================
// CSP FOR SERVING FRONTEND FROM BACKEND
// ========================================
// When serving React build from Express

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files with CSP
app.use(express.static(path.join(__dirname, '../../frontend/dist'), {
  setHeaders: (res, filepath) => {
    // Only set CSP for HTML files
    if (filepath.endsWith('.html')) {
      const directives = getCspDirectives(false); // Production mode
      const cspString = Object.entries(directives)
        .map(([key, values]) => {
          const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return Array.isArray(values) ? `${directive} ${values.join(' ')}` : `${directive} ${values}`;
        })
        .join('; ');
      
      res.setHeader('Content-Security-Policy', cspString);
    }
  }
}));

// ========================================
// ENVIRONMENT-SPECIFIC CSP
// ========================================
// Different CSP for staging/production

const getEnvironmentCsp = () => {
  const env = process.env.NODE_ENV;
  const frontendUrl = process.env.FRONTEND_URL;
  
  switch (env) {
    case 'development':
      return {
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
      };
    
    case 'staging':
      return {
        scriptSrc: ["'self'", "'unsafe-inline'", frontendUrl],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        connectSrc: ["'self'", frontendUrl, "https://api.staging.example.com"],
      };
    
    case 'production':
      return getCspDirectives(false); // Strict production CSP
    
    default:
      return getCspDirectives(true);
  }
};

app.use((req, res, next) => {
  const directives = getEnvironmentCsp();
  // ... apply CSP
  next();
});

// ========================================
// DEBUGGING CSP
// ========================================
// Log CSP headers in development

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name, value) {
      if (name.toLowerCase() === 'content-security-policy') {
        console.log('\n🔒 CSP Header Set:');
        console.log(value);
        console.log('');
      }
      return originalSetHeader.apply(this, arguments);
    };
    next();
  });
}

// ========================================
// CSP TESTING ENDPOINT
// ========================================
// Endpoint to view current CSP configuration

app.get('/api/csp-config', (req, res) => {
  const directives = getCspDirectives(process.env.NODE_ENV !== 'production');
  
  res.json({
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    cspDirectives: directives,
    cspString: Object.entries(directives)
      .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return Array.isArray(values) ? `${directive} ${values.join(' ')}` : `${directive} ${values}`;
      })
      .join('; ')
  });
});

export default app;
