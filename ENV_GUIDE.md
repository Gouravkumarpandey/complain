# Environment Files Guide

## 📁 Backend Environment (.env)
**Location:** `backend/.env`

**Purpose:** Server-side configuration with sensitive secrets

**Contains:**
- MongoDB connection string
- JWT secret keys
- OAuth secrets (Google, Facebook)
- Stripe API keys
- Email credentials
- AI API keys (DeepSeek)
- Redis URL

**Deployment:**
- For Vercel: Add these as **Environment Variables** in Vercel Dashboard
- Never commit this file to Git (listed in .gitignore)

---

## 🎨 Frontend Environment Files

### 1. `.env` (Development)
**Location:** `frontend/.env`

**Purpose:** Local development configuration

**Contains:**
- `VITE_API_BASE_URL=http://localhost:5001/api`
- `VITE_SOCKET_SERVER_URL=http://localhost:5001`
- OAuth client IDs (public, safe to commit)
- Local development settings

**When used:** `npm run dev`

---

### 2. `.env.production` (Production)
**Location:** `frontend/.env.production`

**Purpose:** Production deployment configuration

**Contains:**
- `VITE_API_BASE_URL=https://complain-backend.vercel.app/api`
- `VITE_SOCKET_SERVER_URL=https://complain-backend.vercel.app`
- Production OAuth settings

**When used:** `npm run build` or Vercel deployment

---

## 🔗 Current Deployment URLs

### Backend
- **Primary:** https://complain-backend.vercel.app
- **API Endpoint:** https://complain-backend.vercel.app/api
- **Deployment:** complain-backend-f2tf6rs2t-gouravs-projects-95bc4c63.vercel.app

### Frontend
- **Primary:** https://complain-beta.vercel.app
- **Deployment:** complain-1lz40og8z-gouravs-projects-95bc4c63.vercel.app

---

## 🚀 Deployment Checklist

### Backend (Vercel)
1. Go to Vercel Dashboard → complain-backend → Settings → Environment Variables
2. Add all variables from `backend/.env`
3. Set `FRONTEND_URL=https://complain-beta.vercel.app`
4. Set `BACKEND_URL=https://complain-backend.vercel.app`
5. Redeploy

### Frontend (Vercel)
1. No manual setup needed
2. Vercel automatically uses `.env.production` for builds
3. Ensure `VITE_API_BASE_URL` points to backend
4. Deploy

---

## 🔐 Security Notes

### ✅ Safe to Commit (Frontend)
- `.env` - Local development
- `.env.production` - Production URLs
- OAuth **Client IDs** (public)

### ❌ Never Commit (Backend)
- `backend/.env` - Contains secrets
- OAuth **Client Secrets**
- Database credentials
- API keys
- Stripe secret keys

---

## 🛠️ Environment Variables Naming

**Backend:** Standard Node.js naming
```
MONGODB_URI=...
JWT_SECRET=...
GOOGLE_CLIENT_SECRET=...
```

**Frontend (Vite):** Must be prefixed with `VITE_`
```
VITE_API_BASE_URL=...
VITE_GOOGLE_CLIENT_ID=...
VITE_FACEBOOK_APP_ID=...
```

---

## 📝 How to Update URLs

If your deployment URLs change:

1. **Backend:** Update `FRONTEND_URL` in Vercel env variables
2. **Frontend:** Update `VITE_API_BASE_URL` in `.env.production`
3. Commit frontend changes and redeploy both
