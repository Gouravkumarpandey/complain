# Admin Access Configuration

## Overview
The admin functionality has been separated from regular user login/signup to enhance security. Admin access is now available only through a direct URL.

## Changes Made

### 1. Removed Admin Option from Regular Forms
- Removed admin role option from regular login/signup forms
- Updated TypeScript types to exclude admin role from regular authentication
- Modified GoogleRoleSelection component to exclude admin option

### 2. Created Separate Admin Login
- New AdminLogin component with enhanced security styling
- Direct URL access only: `/admin`
- Enhanced security with warning messages and access logging

### 3. Backend Security Enhancements
- New `adminLogin` endpoint: `POST /api/auth/admin-login`
- Strict role verification (only users with `role: 'admin'` can login)
- Enhanced logging for security monitoring
- Failed admin login attempts are logged

## Admin Access Details

### URL
Access admin panel directly via: `https://your-domain.com/admin`

### Admin Credentials
**Email:** `admin@complaint-system.com`  
**Password:** `Admin123!`

> ⚠️ **Security Note:** Change these default credentials in production!

## How to Access Admin Panel

1. Navigate directly to `/admin` URL
2. Use admin credentials to login
3. System will verify admin role and redirect to dashboard
4. All access attempts are logged for security

## Security Features

- ✅ Admin login separated from regular user authentication
- ✅ Role-based access control enforced
- ✅ Failed login attempts logged
- ✅ Direct URL access only (no navigation links)
- ✅ Enhanced UI with security warnings
- ✅ Access monitoring and logging

## Development Notes

- Admin users can still be created programmatically via the seeding script
- For production, consider additional security measures like IP whitelisting
- Monitor logs for unauthorized access attempts
- Consider implementing rate limiting for admin login attempts

## File Changes

### Frontend
- `LoginForm.tsx` - Removed admin role option
- `GoogleRoleSelection.tsx` - Removed admin role option  
- `AdminLogin.tsx` - New separate admin login component
- `App.tsx` - Added `/admin` route

### Backend
- `authController.js` - Added `adminLogin` function
- `auth.js` - Added `/admin-login` route

## Testing

1. Regular users can no longer select admin role during signup/login
2. Admin access is only available via `/admin` URL
3. Only users with `role: 'admin'` can access admin login
4. Non-admin users receive access denied message