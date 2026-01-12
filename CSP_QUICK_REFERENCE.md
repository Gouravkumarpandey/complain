# CSP Configuration - Quick Reference

## What's Been Implemented

### Files Created/Modified

1. ✅ **`backend/src/middleware/cspConfig.js`** - CSP configuration module
2. ✅ **`backend/src/server.js`** - Updated to use new CSP config
3. ✅ **`RENDER_CSP_DEPLOYMENT_GUIDE.md`** - Complete deployment guide

### CSP Implementation Options

You have **TWO** ways to use CSP (currently using Option 2):

#### Option 1: Manual CSP Middleware (Full Control)

```javascript
import { cspMiddleware } from './middleware/cspConfig.js';

// Apply before other middleware
app.use(cspMiddleware);
```

#### Option 2: Helmet CSP (Recommended - Currently Active) ✅

```javascript
import helmet from 'helmet';
import { getHelmetCspConfig } from './middleware/cspConfig.js';

const isDevelopment = process.env.NODE_ENV !== 'production';
app.use(helmet(getHelmetCspConfig(isDevelopment)));
```

---

## Allowed Sources (Production-Ready)

### Scripts (`script-src`)
- ✅ Same origin (`'self'`)
- ✅ Inline scripts (`'unsafe-inline'`) - Required for Vite
- ✅ `https://accounts.google.com` - Google OAuth
- ✅ `https://apis.google.com` - Google APIs
- ✅ `https://connect.facebook.net` - Facebook SDK
- ✅ `https://cdn.jsdelivr.net` - BeerCSS/Materialize

### Styles (`style-src`)
- ✅ Same origin (`'self'`)
- ✅ Inline styles (`'unsafe-inline'`) - Required for React/Tailwind
- ✅ `https://accounts.google.com` - Google OAuth styles
- ✅ `https://cdn.jsdelivr.net` - CDN stylesheets
- ✅ `https://fonts.googleapis.com` - Google Fonts

### Fonts (`font-src`)
- ✅ Same origin (`'self'`)
- ✅ Data URIs (`data:`)
- ✅ `https://cdn.jsdelivr.net` - Material Icons, BeerCSS fonts
- ✅ `https://fonts.gstatic.com` - Google Fonts

### Images (`img-src`)
- ✅ Same origin (`'self'`)
- ✅ Data URIs (`data:`)
- ✅ Blob URLs (`blob:`)
- ✅ All HTTPS (`https:`) - For profile pictures, external images

### Connections (`connect-src`)
- ✅ Same origin (`'self'`)
- ✅ Frontend URL (configured via env)
- ✅ Backend URL (configured via env)
- ✅ WebSocket URLs (`wss://` or `ws://`)
- ✅ `https://accounts.google.com` - Google OAuth
- ✅ `https://www.googleapis.com` - Google APIs
- ✅ `https://graph.facebook.com` - Facebook Graph API
- ✅ `https://connect.facebook.net` - Facebook SDK
- ✅ `https://openrouter.ai` - DeepSeek AI API
- ✅ `https://api.stripe.com` - Stripe Payments

### Frames (`frame-src`)
- ✅ Same origin (`'self'`)
- ✅ `https://accounts.google.com` - Google OAuth iframe
- ✅ `https://www.facebook.com` - Facebook login
- ✅ `https://js.stripe.com` - Stripe checkout

---

## Environment-Specific Behavior

### Development Mode (`NODE_ENV !== 'production'`)
```javascript
{
  scriptSrc: ["'unsafe-eval'"],  // Allows eval() for HMR
  upgradeInsecureRequests: null, // Allows HTTP in dev
  blockAllMixedContent: null,    // Allows mixed content
}
```

### Production Mode (`NODE_ENV === 'production'`)
```javascript
{
  scriptSrc: [],                     // No eval()
  upgradeInsecureRequests: [],       // Forces HTTPS
  blockAllMixedContent: [],          // Blocks HTTP resources
  hsts: { maxAge: 31536000 },        // 1 year HSTS
}
```

---

## How to Add New Domains

### 1. Edit `backend/src/middleware/cspConfig.js`

```javascript
export const getCspDirectives = (isDevelopment = false) => {
  const baseDirectives = {
    // ... existing config
    
    // Example: Adding new analytics service
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://cdn.jsdelivr.net",
      "https://analytics.newservice.com", // ← Add here
    ],
    
    // Example: Adding new API endpoint
    connectSrc: [
      "'self'",
      frontendUrl,
      backendUrl,
      "https://api.newservice.com", // ← Add here
    ],
  };
  
  return baseDirectives;
};
```

### 2. Test Locally

```bash
cd backend
npm run dev
```

Check browser console for CSP violations.

### 3. Deploy

```bash
git add backend/src/middleware/cspConfig.js
git commit -m "feat: add new domain to CSP"
git push origin main
```

Render will auto-deploy.

---

## CSP Violation Monitoring

### View Violations in Logs

Backend logs will show:
```
CSP Violation Report: {
  time: '2026-01-07T...',
  documentUri: 'https://your-app.com',
  violatedDirective: 'script-src',
  blockedUri: 'https://unknown-domain.com/script.js',
}
```

### CSP Report Endpoint

Already configured: `POST /api/csp-report`

Reports are logged but not stored (add database storage if needed).

---

## Testing CSP

### 1. Check Headers

```bash
curl -I https://your-backend.onrender.com/api/health | grep -i "content-security"
```

Expected:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com ...
```

### 2. Browser DevTools

1. Open your app
2. F12 → Console tab
3. Look for red CSP violation errors
4. Should see: ✅ **No violations**

### 3. CSP Evaluator Tool

Use Google's CSP Evaluator:
https://csp-evaluator.withgoogle.com/

Paste your CSP header to check for issues.

---

## Common CSP Violations & Fixes

### ❌ "Refused to load script from 'https://example.com'"

**Fix**: Add to `scriptSrc`:
```javascript
scriptSrc: [
  "'self'",
  "https://example.com",
]
```

### ❌ "Refused to connect to 'https://api.example.com'"

**Fix**: Add to `connectSrc`:
```javascript
connectSrc: [
  "'self'",
  "https://api.example.com",
]
```

### ❌ "Refused to load stylesheet from 'https://cdn.example.com'"

**Fix**: Add to `styleSrc`:
```javascript
styleSrc: [
  "'self'",
  "'unsafe-inline'",
  "https://cdn.example.com",
]
```

### ❌ "Refused to load font from 'https://fonts.example.com'"

**Fix**: Add to `fontSrc`:
```javascript
fontSrc: [
  "'self'",
  "https://fonts.example.com",
]
```

### ❌ "Refused to frame 'https://widget.example.com'"

**Fix**: Add to `frameSrc`:
```javascript
frameSrc: [
  "'self'",
  "https://widget.example.com",
]
```

---

## Render-Specific Configuration

### Required Environment Variables

Set in Render Dashboard → Backend Service → Environment:

```env
# CRITICAL for CSP to work correctly
FRONTEND_URL=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
NODE_ENV=production
```

### Auto-Deploy Trigger

Render watches your `main` branch. After editing CSP config:

```bash
git push origin main
```

Render will automatically:
1. Pull latest code
2. Run `npm install`
3. Restart with new CSP config
4. Show logs in real-time

---

## Security Checklist

- [x] No wildcard sources (`*`)
- [x] No `unsafe-eval` in production
- [x] Minimal `unsafe-inline` (only where necessary)
- [x] HTTPS enforced in production
- [x] HSTS enabled
- [x] XSS protection enabled
- [x] Clickjacking prevention
- [x] MIME sniffing prevention
- [x] Secure OAuth flows
- [x] WebSocket connections secured

---

## Advanced: Nonce-based CSP (Optional)

For even stronger security, you can use nonces instead of `'unsafe-inline'`:

```javascript
// Generate nonce per request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Update CSP to use nonce
scriptSrc: [
  "'self'",
  (req, res) => `'nonce-${res.locals.nonce}'`,
]

// In HTML
<script nonce="<%= nonce %>">
  // Inline script
</script>
```

**Note**: This requires server-side rendering. Not applicable for Vite static builds.

---

## Resources

- **MDN CSP Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **Helmet.js Docs**: https://helmetjs.github.io/
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
- **Render Docs**: https://render.com/docs
- **OWASP CSP**: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

---

## Need Help?

1. Check browser console for specific violation
2. Add domain to appropriate directive in `cspConfig.js`
3. Test locally with `npm run dev`
4. Deploy and verify
5. Check Render logs for backend errors

**CSP is working correctly if you see no console errors and all features work! ✅**
