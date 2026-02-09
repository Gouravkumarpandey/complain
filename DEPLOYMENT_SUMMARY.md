# Production Deployment Configuration - Summary

## ✅ Changes Made

### 1. Frontend Environment Variables (.env.production)
**File**: `frontend/.env.production`

Already configured correctly with:
```env
VITE_API_BASE_URL=https://complai-y8tj.onrender.com/api
VITE_API_URL=https://complai-y8tj.onrender.com/api
VITE_SOCKET_SERVER_URL=https://complai-y8tj.onrender.com
```

### 2. Frontend Code Updates

#### a. API Configuration (`src/utils/api.ts`)
- ✅ Updated default fallback from `localhost:3001` → `localhost:5001`
- ✅ Updated documentation to reference Render backend URL
- Uses environment variables: `VITE_API_BASE_URL` or `VITE_API_URL`

#### b. AI Service (`src/services/aiService.ts`)
- ✅ Updated fetch URL to use `VITE_API_BASE_URL`
- ✅ Changed fallback from `localhost:3001` → `localhost:5001`

#### c. Socket Context (`src/contexts/SocketContext.tsx`)
- ✅ Updated WebSocket connection fallback from `localhost:3001` → `localhost:5001`
- Uses environment variable: `VITE_SOCKET_SERVER_URL`

### 3. Backend CORS Configuration

**File**: `backend/src/server.js`

✅ Added support for Vercel deployments:
```javascript
origin: [
  "https://quickfix.innovexlabs.me",
  "https://innovexlabs.me",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5001",
  "https://complain-beta.vercel.app",
  // Regex pattern for all Vercel preview deployments
  /^https:\/\/complain-.*\.vercel\.app$/
]
```

### 4. Cross-Origin-Opener-Policy Headers

✅ Already configured in:
- `backend/src/server.js` - Middleware added
- `backend/src/middleware/cspConfig.js` - Helmet configuration
- `frontend/vite.config.ts` - Dev server headers
- `frontend/vercel.json` - Production headers

---

## 🚀 Next Steps - IMPORTANT

### For Local Development:
1. **Restart both servers** to apply the changes:
   ```bash
   # Stop current processes (Ctrl+C in each terminal)
   
   # In backend terminal:
   cd backend
   npm run dev
   
   # In frontend terminal:
   cd frontend
   npm run dev
   ```

### For Production Deployment:

#### Frontend (Vercel):
1. **Commit and push your changes** to your Git repository:
   ```bash
   git add .
   git commit -m "Configure production API URLs for Render backend"
   git push
   ```

2. **Vercel will automatically redeploy** when you push to your main branch

3. **Verify environment variables** in Vercel dashboard:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Ensure these are set:
     ```
     VITE_API_BASE_URL=https://complai-y8tj.onrender.com/api
     VITE_API_URL=https://complai-y8tj.onrender.com/api
     VITE_SOCKET_SERVER_URL=https://complai-y8tj.onrender.com
     VITE_GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
     VITE_FB_APP_ID=786223494164698
     ```

#### Backend (Render):
1. **Commit and push backend changes**:
   ```bash
   git add backend/
   git commit -m "Update CORS to allow Vercel frontend domains"
   git push
   ```

2. **Render will automatically redeploy** your backend service

3. **Verify backend environment variables** in Render dashboard:
   - Ensure `FRONTEND_URL` includes your Vercel domain
   - Verify all OAuth credentials are set

---

## 🔍 Testing After Deployment

### 1. Check API Connection
Open browser console on your Vercel deployment and verify:
```
✅ API configured with base URL: https://complai-y8tj.onrender.com/api
```

### 2. Test Google OAuth
- Click "Sign in with Google"
- Should open popup without COOP errors
- Should successfully authenticate

### 3. Test WebSocket Connection
- After login, check console for:
```
🔌 Socket connecting to: https://complai-y8tj.onrender.com
✅ Socket connected: [socket-id]
```

### 4. Verify CORS
- All API calls should work without CORS errors
- Check Network tab for successful requests

---

## 📋 Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://complai-y8tj.onrender.com/api
VITE_API_URL=https://complai-y8tj.onrender.com/api
VITE_SOCKET_SERVER_URL=https://complai-y8tj.onrender.com
VITE_GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
VITE_FB_APP_ID=786223494164698
VITE_FACEBOOK_APP_ID=786223494164698
VITE_GEMINI_API_KEY=AIzaSyD6f0ZNQhuVFdKNi07k5pvI50J6Sx1pDKM
VITE_APP_NAME="QuickFix - AI Powered Complaint System"
```

### Backend (Render Environment Variables)
```env
NODE_ENV=production
FRONTEND_URL=https://complain-beta.vercel.app
BACKEND_URL=https://complai-y8tj.onrender.com
MONGODB_URI=[your-mongodb-uri]
JWT_SECRET=[your-jwt-secret]
GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[your-google-secret]
# ... other secrets
```

---

## ⚠️ Common Issues & Solutions

### Issue: "ERR_CONNECTION_REFUSED"
**Solution**: Verify `VITE_API_BASE_URL` is set correctly in Vercel environment variables

### Issue: "CORS Error"
**Solution**: Ensure your Vercel domain is added to backend CORS origins (already done)

### Issue: "Google Sign-In COOP Error"
**Solution**: Headers already configured in both vite.config.ts and vercel.json

### Issue: "WebSocket connection failed"
**Solution**: Verify `VITE_SOCKET_SERVER_URL` points to `https://complai-y8tj.onrender.com`

---

## 📝 Files Modified

1. ✅ `frontend/.env` - Updated ports from 3001 → 5001
2. ✅ `frontend/src/utils/api.ts` - Updated API base URL
3. ✅ `frontend/src/services/aiService.ts` - Updated AI service URL
4. ✅ `frontend/src/contexts/SocketContext.tsx` - Updated Socket URL
5. ✅ `backend/src/server.js` - Added COOP headers & updated CORS
6. ✅ `frontend/vite.config.ts` - Added COOP headers for dev
7. ✅ `frontend/vercel.json` - Added COOP headers for production

---

## ✨ Summary

All configuration is now complete for production deployment:
- ✅ Frontend configured to use Render backend URL
- ✅ Backend CORS allows Vercel frontend domains
- ✅ Google OAuth COOP headers configured
- ✅ WebSocket connections properly configured
- ✅ All fallback URLs updated to correct ports

**Next action**: Commit, push, and let Vercel/Render auto-deploy!
