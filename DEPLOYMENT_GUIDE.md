# QuickFix Deployment Guide - Vercel

This guide will help you deploy the QuickFix application (both frontend and backend) to Vercel.

## Prerequisites

1. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **GitHub Repository**: Push your code to GitHub
4. **MongoDB Atlas**: Set up a MongoDB database (free tier available)
5. **Redis Cloud**: Set up a Redis instance (free tier available from Upstash or Redis Labs)

## Project Structure

```
complain/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
└── vercel.json        # Root Vercel configuration
```

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Deploy Backend

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (no build needed)
   - **Output Directory**: Leave default
   - **Install Command**: `npm install`

5. **Add Environment Variables** (click "Environment Variables"):
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars
   JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
   REDIS_URL=your_redis_url
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=https://your-frontend-url.vercel.app
   PORT=3000
   ```

6. Click **"Deploy"**
7. Copy your backend URL (e.g., `https://your-backend.vercel.app`)

#### Step 2: Deploy Frontend

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Import the same GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   VITE_SOCKET_URL=https://your-backend.vercel.app
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

5. Click **"Deploy"**
6. Your frontend will be live at `https://your-frontend.vercel.app`

---

### Option 2: Deploy via Vercel CLI

#### Step 1: Login to Vercel
```powershell
vercel login
```

#### Step 2: Deploy Backend
```powershell
cd backend
vercel --prod
```

Follow the prompts:
- **Set up and deploy**: Y
- **Which scope**: Select your account
- **Link to existing project**: N
- **Project name**: quickfix-backend
- **Directory**: ./
- **Override settings**: N

After deployment, add environment variables:
```powershell
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
# ... add all other environment variables
```

#### Step 3: Deploy Frontend
```powershell
cd ../frontend
vercel --prod
```

Follow the prompts:
- **Set up and deploy**: Y
- **Which scope**: Select your account
- **Link to existing project**: N
- **Project name**: quickfix-frontend
- **Directory**: ./
- **Override settings**: N

Add environment variables:
```powershell
vercel env add VITE_API_URL production
vercel env add VITE_SOCKET_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production
```

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | ✅ |
| `REDIS_URL` | Redis connection URL | ✅ |
| `EMAIL_USER` | Gmail address for sending emails | ✅ |
| `EMAIL_PASS` | Gmail app-specific password | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI API key | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `NODE_ENV` | Set to "production" | ✅ |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |
| `VITE_SOCKET_URL` | Backend Socket.IO URL | ✅ |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |

---

## Post-Deployment Configuration

### 1. Update CORS Settings
Make sure your backend CORS configuration allows your frontend domain:

In `backend/src/server.js`, the CORS should be configured to accept your Vercel frontend URL.

### 2. Update MongoDB Network Access
- Go to MongoDB Atlas Dashboard
- Navigate to Network Access
- Add Vercel's IP range or set to `0.0.0.0/0` (allow from anywhere)

### 3. Configure Redis
- If using Upstash Redis, it's serverless-ready
- If using Redis Labs, ensure it accepts connections from Vercel

### 4. Test the Deployment
1. Visit your frontend URL
2. Try registering a new account
3. Test creating a complaint
4. Verify real-time notifications work
5. Test payment integration

---

## Continuous Deployment

Vercel automatically redeploys when you push to your GitHub repository:

1. **Main branch** → Production deployment
2. **Other branches** → Preview deployments

### Trigger Manual Redeployment
```powershell
# From frontend directory
cd frontend
vercel --prod

# From backend directory
cd backend
vercel --prod
```

---

## Troubleshooting

### Issue: "Module not found" errors
**Solution**: Ensure all dependencies are in `package.json`, not just `devDependencies`

### Issue: Environment variables not working
**Solution**: 
- Redeploy after adding environment variables
- Use `vercel env pull` to verify variables locally

### Issue: CORS errors
**Solution**: 
- Add your Vercel frontend URL to backend CORS configuration
- Update `FRONTEND_URL` environment variable in backend

### Issue: MongoDB connection timeout
**Solution**: 
- Check MongoDB Atlas Network Access settings
- Verify connection string is correct
- Ensure IP whitelist includes `0.0.0.0/0`

### Issue: Socket.IO not connecting
**Solution**: 
- Verify `VITE_SOCKET_URL` points to backend URL
- Check that backend accepts WebSocket connections

### Issue: Build fails
**Solution**: 
- Check build logs in Vercel dashboard
- Ensure Node.js version compatibility (Vercel uses Node 18+ by default)
- Verify all build commands work locally

---

## Monitoring & Logs

### View Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click on a deployment
4. View "Logs" tab

### Performance Monitoring
- Vercel provides built-in analytics
- View response times, errors, and traffic in the "Analytics" tab

---

## Scaling Considerations

### Free Tier Limits
- **Bandwidth**: 100GB/month
- **Function Execution**: 100GB-hours
- **Serverless Functions**: 12-second timeout

### Upgrade Path
If you exceed free tier limits:
1. Upgrade to Vercel Pro ($20/month)
2. Get higher limits and better performance
3. Access to advanced analytics

---

## Alternative: Monorepo Deployment

If you want to deploy as a single project:

1. Use the root `vercel.json` configuration
2. Deploy from the root directory
3. Vercel will automatically detect and build both frontend and backend

```powershell
# From root directory
vercel --prod
```

---

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong JWT secrets (min 32 characters)
3. ✅ Enable HTTPS only (Vercel does this automatically)
4. ✅ Set up rate limiting in backend
5. ✅ Use environment variables for all secrets
6. ✅ Regularly rotate API keys
7. ✅ Monitor deployment logs for suspicious activity

---

## Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Upstash Redis**: [upstash.com](https://upstash.com)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

## Quick Start Commands

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd ../frontend
vercel --prod

# View deployments
vercel ls

# Check logs
vercel logs
```

---

## Deployment Checklist

- [ ] MongoDB Atlas database created
- [ ] Redis instance set up
- [ ] All environment variables prepared
- [ ] GitHub repository up to date
- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] CORS configured correctly
- [ ] MongoDB network access configured
- [ ] Test user registration
- [ ] Test complaint creation
- [ ] Test real-time features
- [ ] Test payment integration
- [ ] Monitor logs for errors

---

**Congratulations!** 🎉 Your QuickFix application is now deployed on Vercel!
