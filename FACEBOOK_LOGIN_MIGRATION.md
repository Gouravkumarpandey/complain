# Facebook Login Migration Guide
## React 18 Compatible Implementation

This document explains the migration from `react-facebook-login` to a custom Facebook Login solution using the official Facebook JavaScript SDK.

---

## 📋 What Was Changed

### 1. **Removed Incompatible Package**
- Uninstalled `react-facebook-login` (not compatible with React 18)
- This package caused peer-dependency errors during Vercel deployment

### 2. **Created Custom React 18 Component**
- **File**: `frontend/src/components/auth/FacebookLogin.tsx`
- Uses official Facebook JavaScript SDK
- Fully compatible with React 18 and Vite
- TypeScript support included

### 3. **Updated Backend Authentication**
- **File**: `backend/src/controllers/authController.js`
- Implemented secure token verification using Facebook Graph API
- Validates access tokens with `debug_token` endpoint
- Creates or updates users in MongoDB
- Returns JWT token for session management

---

## 🔧 Frontend Implementation

### Component: `FacebookLogin.tsx`

**Key Features:**
- Dynamically loads Facebook SDK
- Initializes with App ID from environment variables
- Handles login flow with `FB.login()`
- Retrieves user profile (`id`, `name`, `email`, `picture`)
- Error handling and loading states
- Customizable button text and styling

**Usage Example:**

```tsx
import { FacebookLogin } from './components/auth/FacebookLogin';

function LoginPage() {
  const handleSuccess = async (response) => {
    const { profile, auth } = response;
    
    // Send access token to your backend
    const apiResponse = await fetch('/api/auth/facebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accessToken: auth.accessToken 
      })
    });
    
    const data = await apiResponse.json();
    // Store JWT token and user data
    localStorage.setItem('token', data.token);
  };

  const handleFailure = (error) => {
    console.error('Facebook login failed:', error);
    alert(error);
  };

  return (
    <FacebookLogin
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      buttonText="Continue with Facebook"
    />
  );
}
```

---

## 🔐 Backend Implementation

### Endpoint: `POST /api/auth/facebook`

**Request Body:**
```json
{
  "accessToken": "EAABwzLixnjYBO...",
  "isSignup": false
}
```

**Security Flow:**

1. **Token Validation**
   ```javascript
   // Verify token with Facebook
   GET https://graph.facebook.com/debug_token
     ?input_token=USER_ACCESS_TOKEN
     &access_token=APP_ID|APP_SECRET
   ```

2. **App Verification**
   - Checks if token belongs to your app
   - Validates token expiration

3. **User Profile Retrieval**
   ```javascript
   GET https://graph.facebook.com/me
     ?access_token=USER_ACCESS_TOKEN
     &fields=id,name,email,picture
   ```

4. **User Management**
   - Finds existing user by email
   - Creates new user if not exists
   - Updates Facebook ID if needed
   - Marks account as verified

5. **JWT Generation**
   - Returns your application's JWT token
   - Client uses this for subsequent requests

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🌍 Environment Variables

### Frontend (`.env`)

```env
# Facebook OAuth Configuration
VITE_FB_APP_ID=786223494164698
```

⚠️ **IMPORTANT**: Never expose `FACEBOOK_APP_SECRET` in frontend code!

### Backend (`.env`)

```env
# Facebook OAuth Configuration
FACEBOOK_APP_ID=786223494164698
FACEBOOK_APP_SECRET=f621d39cd723546936b13eb55c623cc4
```

🔒 **Security Note**: The App Secret should ONLY be stored on the backend server.

---

## 📱 Facebook App Configuration

### Required Settings in Facebook Developers Console

1. **Go to**: https://developers.facebook.com/apps/

2. **App Domains**:
   - Add your production domain (e.g., `quickfix.vercel.app`)
   - Add localhost for development: `localhost`

3. **Facebook Login Settings**:
   - Valid OAuth Redirect URIs:
     - Development: `http://localhost:5173`
     - Production: `https://quickfix.vercel.app`

4. **Permissions**:
   - `public_profile` (Default)
   - `email` (Must be requested)

5. **App Review**:
   - For production, submit `email` permission for review
   - Development/testing works without approval

---

## ✅ Deployment Checklist

### Before Deploying to Vercel:

- [x] ✅ Removed `react-facebook-login` from `package.json`
- [x] ✅ Created `FacebookLogin.tsx` component
- [x] ✅ Updated `LoginForm.tsx` to use new component
- [x] ✅ Added backend token verification endpoint
- [x] ✅ Added `VITE_FB_APP_ID` to frontend `.env`
- [ ] ⚠️ Configure Facebook App domains in Facebook Console
- [ ] ⚠️ Add Vercel production URL to Facebook OAuth redirects
- [ ] ⚠️ Set environment variables in Vercel dashboard

### Vercel Environment Variables:

**Frontend (vercel.com → Your Project → Settings → Environment Variables)**
```
VITE_FB_APP_ID=786223494164698
VITE_GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
VITE_API_URL=https://your-backend.vercel.app/api
```

**Backend**
```
FACEBOOK_APP_ID=786223494164698
FACEBOOK_APP_SECRET=f621d39cd723546936b13eb55c623cc4
JWT_SECRET=your-jwt-secret
MONGODB_URI=your-mongodb-uri
```

---

## 🔍 Testing

### Local Testing:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open: `http://localhost:5173`
4. Click "Continue with Facebook"
5. Authorize app and verify login works

### Debug Console:

Check browser console for:
- `✅ Facebook SDK loaded successfully`
- `✅ New Facebook user created` or `✅ Existing Facebook user logged in`

---

## 🚨 Common Issues & Solutions

### Issue: "Facebook SDK not loaded"
**Solution**: Check internet connection and firewall settings

### Issue: "Facebook App ID is not configured"
**Solution**: Ensure `VITE_FB_APP_ID` is set in `.env` and restart dev server

### Issue: "Invalid Facebook access token"
**Solution**: 
- Verify `FACEBOOK_APP_SECRET` is correct in backend `.env`
- Check token hasn't expired
- Ensure user granted email permission

### Issue: "Email not available"
**Solution**: 
- User must grant email permission
- Check Facebook app has email permission enabled
- Some Facebook accounts don't have verified emails

---

## 📚 Additional Resources

- **Facebook Login Documentation**: https://developers.facebook.com/docs/facebook-login/web
- **Graph API Reference**: https://developers.facebook.com/docs/graph-api/
- **Token Debugging**: https://developers.facebook.com/tools/debug/accesstoken/

---

## 🎉 Benefits of New Implementation

1. ✅ **React 18 Compatible** - No peer dependency errors
2. ✅ **Secure** - Backend token verification
3. ✅ **Type-Safe** - Full TypeScript support
4. ✅ **Customizable** - Easy to style and extend
5. ✅ **Production-Ready** - Works with Vercel deployment
6. ✅ **Maintainable** - Uses official Facebook SDK

---

**Migration completed successfully!** 🚀
