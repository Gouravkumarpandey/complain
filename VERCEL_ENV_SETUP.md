# VERCEL ENVIRONMENT VARIABLES SETUP GUIDE

## 🎯 IMPORTANT: Don't Copy .env Files!

**The .env files in your code are NOT uploaded to Vercel.**  
You must **manually add** environment variables in the Vercel Dashboard.

---

## 📱 FRONTEND (complain-beta.vercel.app)

### Go to Vercel Dashboard:
1. Open: https://vercel.com/dashboard
2. Click your **frontend project** (complain-beta)
3. Go to: **Settings** → **Environment Variables**
4. Add these variables ONE BY ONE:

### Variables to Add:

```bash
# API Configuration
VITE_API_BASE_URL=https://complain-backend.vercel.app/api
VITE_API_URL=https://complain-backend.vercel.app/api

# WebSocket Configuration  
VITE_SOCKET_SERVER_URL=https://complain-backend.vercel.app
VITE_SOCKET_PORT=443

# Google OAuth
VITE_GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com

# Facebook OAuth
VITE_FB_APP_ID=786223494164698
VITE_FACEBOOK_APP_ID=786223494164698

# GitHub OAuth (if using)
VITE_GITHUB_CLIENT_ID=your-github-client-id

# AI Configuration
VITE_GEMINI_API_KEY=AIzaSyD6f0ZNQhuVFdKNi07k5pvI50J6Sx1pDKM

# App Name
VITE_APP_NAME=QuickFix - AI Powered Complaint System
```

### For Each Variable:
- Click **"Add New"**
- Name: `VITE_API_BASE_URL`
- Value: `https://complain-backend.vercel.app/api`
- Environment: Select **"Production"** ✅
- Click **"Save"**

---

## 🔧 BACKEND (complain-backend.vercel.app)

### Go to Vercel Dashboard:
1. Open: https://vercel.com/dashboard
2. Click your **backend project** (complain-backend)
3. Go to: **Settings** → **Environment Variables**
4. Add these variables ONE BY ONE:

### Variables to Add:

```bash
# Node Environment
NODE_ENV=production

# Database
MONGODB_URI=your_mongodb_connection_string_here

# JWT Secret (use a strong random string)
JWT_SECRET=your_strong_jwt_secret_here

# AI Service (if using DeepSeek)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Google OAuth (Backend)
GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Facebook OAuth (Backend)
FB_APP_ID=786223494164698
FB_APP_SECRET=your_facebook_app_secret_here

# Email Service (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_here

# Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

### For Each Variable:
- Click **"Add New"**
- Name: `MONGODB_URI`
- Value: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
- Environment: Select **"Production"** ✅
- Click **"Save"**

---

## ⚠️ CRITICAL SECRETS (Backend Only)

**NEVER add these to frontend:**
- ❌ MONGODB_URI
- ❌ JWT_SECRET
- ❌ GOOGLE_CLIENT_SECRET
- ❌ FB_APP_SECRET
- ❌ EMAIL_PASS
- ❌ STRIPE_SECRET_KEY
- ❌ Any API secrets

**These go in BACKEND Vercel project ONLY!**

---

## 🔄 After Adding Variables

### Frontend:
1. Go to **Deployments** tab
2. Click **"⋯"** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Backend:
1. Go to **Deployments** tab
2. Click **"⋯"** on latest deployment  
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## ✅ Verification

### Test Frontend Connection:
1. Open: https://complain-beta.vercel.app
2. Press **F12** to open browser console
3. Look for: `✅ API configured with base URL: https://complain-backend.vercel.app/api`
4. Should NOT see `localhost`

### Test Backend:
```bash
curl https://complain-backend.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-07...",
  "dbConnected": true
}
```

---

## 📝 Quick Checklist

### Frontend Vercel Dashboard:
- [ ] Added VITE_API_BASE_URL
- [ ] Added VITE_SOCKET_SERVER_URL
- [ ] Added all VITE_* OAuth keys
- [ ] Redeployed frontend

### Backend Vercel Dashboard:
- [ ] Added MONGODB_URI
- [ ] Added JWT_SECRET
- [ ] Added NODE_ENV=production
- [ ] Added OAuth secrets (CLIENT_SECRET, APP_SECRET)
- [ ] Redeployed backend

### Test:
- [ ] Frontend opens without errors
- [ ] Console shows production API URL (not localhost)
- [ ] Can login/register
- [ ] API calls work

---

## 🆘 Still Confused?

**Simple Rule:**
- **Frontend**: Add only `VITE_*` variables
- **Backend**: Add secrets and database credentials

**The .env files in your code are for LOCAL development only!**  
Vercel reads from Dashboard Environment Variables, not from files.
