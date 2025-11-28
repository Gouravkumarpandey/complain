# WebSocket & API 400 Error - FIXES APPLIED

## Issues Fixed

### 1. ✅ WebSocket Connection Failed
**Error:** `WebSocket connection to 'ws://localhost:5001/socket.io/?EIO=4&transport=websocket' failed`

**Root Cause:**
- Socket authentication was failing silently
- No proper error messages sent to client

**Fix Applied:**
- Added `connection_error` event emission on authentication failures
- Enhanced token validation logging
- Better error messages for debugging

### 2. ✅ API 400 Bad Request
**Error:** `Failed to load resource: the server responded with a status of 400 (Bad Request)`

**Root Cause:**
- Using incorrect field name `userId` instead of `user` in Complaint model
- The Complaint schema uses `user` field to reference User model

**Fix Applied:**
- Changed all `filter.userId` to `filter.user`
- Fixed in 3 locations:
  - Main complaints GET route
  - User-specific filtering for admins/agents
  - Stats dashboard route

---

## How to Test

### Step 1: Restart Backend Server

**Important:** Backend changes require restart!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm start
```

### Step 2: Clear Browser Cache & Reload

```bash
# In browser:
1. Open DevTools (F12)
2. Right-click Refresh button
3. Select "Empty Cache and Hard Reload"
```

Or simply:
```bash
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### Step 3: Check Backend Logs

Watch for these **success messages**:

```
✅ Socket connected: [socket_id]
Processing token: eyJhbGciOi...
Token decoded successfully for socket: [socket_id]
Token payload: { id: '...', role: 'user' }
🔐 Socket authenticated successfully
```

**If you see errors:**
```
❌ Socket auth failed: Missing token
❌ Socket auth failed: Invalid token payload
⛔ Socket authentication failed
```

→ Token issue - try logging out and back in

### Step 4: Test Complaints API

#### Test in Browser Console:
```javascript
// Check if complaints load
fetch('http://localhost:5001/api/complaints', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('Complaints:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** List of complaints (or empty array)
**Before Fix:** 400 Bad Request

#### Test via curl:
```bash
# Get your token first by logging in
TOKEN="your_token_here"

# Test complaints endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/complaints
```

---

## Verification Checklist

- [ ] Backend server restarted
- [ ] Frontend refreshed (hard reload)
- [ ] Can login successfully
- [ ] Dashboard loads without errors
- [ ] WebSocket shows "connected" in console
- [ ] Complaints list loads
- [ ] No 400 errors in Network tab
- [ ] No WebSocket errors in Console

---

## What Was Changed

### File: `backend/src/server.js`
**Lines ~129-145**

**Before:**
```javascript
if (!token) {
  return next(new Error("Authentication failed: Missing token"));
}
// No error sent to client
```

**After:**
```javascript
if (!token) {
  socket.emit('connection_error', { message: 'Missing authentication token' });
  return next(new Error("Authentication failed: Missing token"));
}
// Client now receives specific error
```

**Lines ~151-157**

**Before:**
```javascript
if (!userId) {
  return next(new Error("Authentication failed: Invalid token payload"));
}
// Limited logging
```

**After:**
```javascript
console.log('Token payload:', { id: decoded.id, userId: decoded.userId, role: decoded.role });
if (!userId) {
  socket.emit('connection_error', { message: 'Invalid token payload - missing user ID' });
  return next(new Error("Authentication failed: Invalid token payload"));
}
// Enhanced logging and error feedback
```

### File: `backend/src/routes/complaints.js`
**Lines ~98-102**

**Before:**
```javascript
if (req.user.role === 'user') {
  filter.userId = req.user._id;  // ❌ Wrong field
}
```

**After:**
```javascript
if (req.user.role === 'user') {
  filter.user = req.user._id;  // ✅ Correct field
}
```

**Lines ~103-105**

**Before:**
```javascript
} else if (userId && (req.user.role === 'admin' || req.user.role === 'agent')) {
  filter.userId = userId;  // ❌ Wrong field
}
```

**After:**
```javascript
} else if (userId && (req.user.role === 'admin' || req.user.role === 'agent')) {
  filter.user = userId;  // ✅ Correct field
}
```

---

## Understanding the Complaint Model

The Complaint schema uses `user` to reference the User model:

```javascript
// Complaint.js
const complaintSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  // NOT userId!
  title: String,
  description: String,
  // ...
});
```

**Key Point:** Always use `filter.user` when filtering by complaint owner!

---

## Troubleshooting

### Still getting WebSocket errors?

1. **Check token validity:**
```javascript
// In browser console
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Token expired?', payload.exp * 1000 < Date.now());
}
```

2. **Re-login:**
- Logout
- Clear localStorage: `localStorage.clear()`
- Login again

3. **Check backend logs:**
Look for specific error messages about authentication

### Still getting 400 errors?

1. **Check which endpoint:**
- Look in Network tab for the exact URL
- Check the request payload

2. **Verify backend changes:**
```bash
# In backend folder
grep -n "filter.userId" src/routes/complaints.js
# Should return nothing (all changed to filter.user)
```

3. **Check database:**
```javascript
// MongoDB shell
use quickfix
db.complaints.findOne()
// Verify it has 'user' field, not 'userId'
```

---

## Quick Command Reference

```bash
# Restart backend
cd backend
npm start

# Check backend logs
tail -f logs/combined.log  # if using winston logger

# Clear frontend build cache
cd frontend
rm -rf node_modules/.vite
npm run dev

# Test socket connection
curl -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:5001/socket.io/
```

---

## Expected Behavior After Fix

### Frontend Console (Success):
```
🔌 Socket connecting to: http://localhost:5001
Initializing socket with options: {...}
✅ Socket connected: abc123xyz
🔐 Socket authenticated successfully: { userId: '...', role: 'user' }
```

### Backend Console (Success):
```
Socket connection attempt: abc123xyz
Processing token: eyJhbGciOi...xyz
Token decoded successfully for socket: abc123xyz
Token payload: { id: '60f1...', role: 'user' }
✅ User authenticated and connected: user@example.com (user)
```

### Network Tab (Success):
- All `/api/complaints` requests return 200 OK
- WebSocket shows "101 Switching Protocols"
- No 400 errors

---

## Need More Help?

If issues persist:

1. **Share backend logs** (last 50 lines after restart)
2. **Share frontend console** (all errors)
3. **Share Network tab** (filter by "complaints" and show status codes)
4. **Check token:** Run the token validation script above

---

Last Updated: November 28, 2025
Status: ✅ FIXED - Restart required!
