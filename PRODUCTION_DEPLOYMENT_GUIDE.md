# Production Deployment Guide - Frontend & Backend Communication

## 📋 Overview

This guide explains how your monorepo is configured for production deployment on Vercel, with the frontend and backend communicating correctly.

## 🏗️ Architecture

```
Frontend (Vercel)                    Backend (Vercel)
complain-beta.vercel.app  ←────→  complain-backend.vercel.app
     React + TypeScript                Node.js + Express
     Vite Build                        Serverless Functions
```

## ✅ Completed Changes

### 1️⃣ Frontend: Shared Axios Instance

**File:** `frontend/src/utils/api.ts`

Created a centralized Axios instance that:
- ✅ Uses `VITE_API_BASE_URL` from environment variables
- ✅ Automatically attaches authentication tokens
- ✅ Enables credentials support for cookies/sessions
- ✅ Handles token expiration automatically
- ✅ Provides error handling interceptors

**Key Features:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});
```

### 2️⃣ Updated Services

**Updated Files:**
- ✅ `frontend/src/services/apiService.ts` - Main API service
- ✅ `frontend/src/services/complaintService.ts` - Complaint operations
- ✅ `frontend/src/services/subscriptionService.ts` - Subscription management
- ✅ `frontend/src/services/aiService.ts` - AI features
- ✅ `frontend/src/hooks/useTokenValidation.ts` - Token validation

**Changes:**
- Removed all hardcoded `localhost:5001` URLs
- Replaced `fetch()` calls with shared Axios instance
- Centralized error handling
- Consistent credential handling

### 3️⃣ Backend: CORS Configuration

**File:** `backend/src/server.js`

Updated CORS to allow:
- ✅ All Vercel frontend domains (`*.vercel.app`)
- ✅ Specific production URLs
- ✅ Local development (`localhost:5173`)
- ✅ Credentials support

```javascript
app.use(cors({
  origin: function (origin, callback) {
    // Allow Vercel domains
    if (origin && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Specific allowed origins
    const allowedOrigins = [
      'https://complain-beta.vercel.app',
      'https://complain-git-main-gouravs-projects-95bc4c63.vercel.app',
      'http://localhost:5173'
    ];
    // ... rest of configuration
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));
```

### 4️⃣ Health Check Endpoint

**Endpoint:** `GET /api/health`

Returns:
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T10:30:00.000Z",
  "server": "QuickFix Backend API",
  "version": "1.0.0",
  "serverSessionId": "session-...",
  "dbConnected": true,
  "environment": "production"
}
```

**Usage:**
```bash
curl https://complain-backend.vercel.app/api/health
```

### 5️⃣ Vercel Configuration

**File:** `backend/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

## 🔧 Environment Variables

### Frontend (Vercel Dashboard)

Navigate to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://complain-backend.vercel.app/api` | ✅ Yes |
| `VITE_API_URL` | `https://complain-backend.vercel.app/api` | ⚠️ Legacy |
| `VITE_SOCKET_SERVER_URL` | `https://complain-backend.vercel.app` | ✅ Yes |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | ☑️ If using OAuth |
| `VITE_FB_APP_ID` | Your Facebook App ID | ☑️ If using OAuth |
| `VITE_GEMINI_API_KEY` | Your Gemini API Key | ☑️ If using AI |

### Backend (Vercel Dashboard)

Navigate to: **Vercel Dashboard → Backend Project → Settings → Environment Variables**

Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `MONGODB_URI` | Your MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Your JWT secret key | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `DEEPSEEK_API_KEY` | Your DeepSeek API key | ☑️ If using AI |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | ☑️ If using OAuth |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Secret | ☑️ If using OAuth |
| `FB_APP_ID` | Your Facebook App ID | ☑️ If using OAuth |
| `FB_APP_SECRET` | Your Facebook App Secret | ☑️ If using OAuth |

## 🚀 Deployment Steps

### Step 1: Deploy Backend

```bash
cd backend
vercel --prod
```

**Expected URL:** `https://complain-backend.vercel.app`

### Step 2: Update Frontend Environment Variables

In Vercel Dashboard (Frontend):
- Set `VITE_API_BASE_URL=https://complain-backend.vercel.app/api`

### Step 3: Deploy Frontend

```bash
cd frontend
vercel --prod
```

**Expected URL:** `https://complain-beta.vercel.app`

### Step 4: Verify Deployment

1. **Test Health Endpoint:**
   ```bash
   curl https://complain-backend.vercel.app/api/health
   ```

2. **Test Frontend:**
   - Open: `https://complain-beta.vercel.app`
   - Open browser console (F12)
   - Look for: `✅ API configured with base URL: https://complain-backend.vercel.app/api`

3. **Test API Communication:**
   - Try logging in
   - Check Network tab for API calls
   - Verify requests go to `complain-backend.vercel.app`

## 🔍 Verification Checklist

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads without console errors
- [ ] API calls use correct backend URL (no localhost)
- [ ] CORS headers present in API responses
- [ ] Authentication works (login/register)
- [ ] WebSocket connections establish (if using)
- [ ] No mixed content warnings (HTTP/HTTPS)

## 🐛 Troubleshooting

### Issue: CORS Error in Production

**Symptoms:**
```
Access to XMLHttpRequest at 'https://complain-backend.vercel.app/api/...' 
from origin 'https://complain-beta.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Check backend CORS configuration includes your frontend domain
2. Verify `credentials: true` is set in CORS config
3. Check backend logs in Vercel Dashboard

### Issue: API Calls Go to Localhost

**Symptoms:**
- Network tab shows requests to `localhost:5001`
- API calls fail in production

**Solution:**
1. Verify `VITE_API_BASE_URL` is set in Vercel environment variables
2. Rebuild and redeploy frontend
3. Clear browser cache
4. Check browser console for: `✅ API configured with base URL`

### Issue: 401 Unauthorized

**Symptoms:**
- All API calls return 401
- User gets logged out immediately

**Solution:**
1. Check JWT_SECRET is same in both environments
2. Verify token is being sent in Authorization header
3. Check backend logs for token validation errors
4. Ensure `withCredentials: true` in Axios config

### Issue: Environment Variables Not Loading

**Symptoms:**
- `import.meta.env.VITE_API_BASE_URL` is undefined
- Console shows: `http://localhost:5001/api`

**Solution:**
1. Verify variables are prefixed with `VITE_`
2. Redeploy after adding environment variables
3. Check Vercel Dashboard → Settings → Environment Variables
4. Ensure variables are set for "Production" environment

## 📊 Example API Calls

### Authentication
```typescript
// Login - Now uses shared Axios instance
import apiService from '@/services/apiService';

const result = await apiService.login('user@example.com', 'password');
// Automatically sends to: https://complain-backend.vercel.app/api/auth/login
```

### Complaints
```typescript
// Get complaints - No hardcoded URLs
import apiService from '@/services/apiService';

const complaints = await apiService.getComplaints({ status: 'open' });
// Automatically sends to: https://complain-backend.vercel.app/api/complaints?status=open
```

### Direct Axios Usage
```typescript
// Using shared instance directly
import api from '@/utils/api';

const response = await api.get('/analytics/dashboard');
// Automatically sends to: https://complain-backend.vercel.app/api/analytics/dashboard
```

## 🔐 Security Notes

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Use environment variables** - Never hardcode secrets
3. **HTTPS only in production** - Vercel provides this automatically
4. **Validate CORS origins** - Don't use `*` in production
5. **Rotate JWT secrets** - Use strong, random keys
6. **Enable rate limiting** - Protect against abuse

## 📝 Files Modified

### Frontend
- ✅ `src/utils/api.ts` - New shared Axios instance
- ✅ `src/services/apiService.ts` - Updated to use shared instance
- ✅ `src/services/complaintService.ts` - Updated to use shared instance
- ✅ `src/services/subscriptionService.ts` - Updated to use shared instance
- ✅ `src/services/aiService.ts` - Updated to use shared instance
- ✅ `src/hooks/useTokenValidation.ts` - Updated environment variable
- ✅ `.env` - Updated with VITE_API_BASE_URL
- ✅ `.env.production` - Created for production config
- ✅ `.env.vercel` - Created for Vercel deployment

### Backend
- ✅ `src/server.js` - Updated CORS configuration
- ✅ `vercel.json` - Created for Vercel serverless deployment

## 🎯 Next Steps

1. **Deploy to Production:**
   - Deploy backend first
   - Update frontend environment variables
   - Deploy frontend

2. **Monitor Performance:**
   - Check Vercel Analytics
   - Monitor API response times
   - Watch error logs

3. **Set Up CI/CD:**
   - Configure automatic deployments
   - Add preview deployments for branches
   - Set up staging environment

4. **Enable Monitoring:**
   - Add error tracking (Sentry)
   - Set up uptime monitoring
   - Configure alerts

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)

---

**Last Updated:** January 7, 2026  
**Status:** ✅ Production Ready
