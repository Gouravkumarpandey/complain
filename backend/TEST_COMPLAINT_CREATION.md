# Testing Complaint Creation

## Issue Fixed
The complaint creation was failing because:
1. **Schema mismatch**: The code was using `slaTarget` (Date) but schema expects `sla` (Object with nested structure)
2. **Field mismatch**: The code was using `sentiment` at root level but schema expects it inside `aiAnalysis`
3. **Inconsistent field names**: Some routes used `userId` while schema uses `user`
4. **Priority mismatch**: Code used `'Urgent'` but schema expects `'Critical'`

## Changes Made

### 1. Fixed Complaint Creation (`complaints.js` POST route)
- Changed `slaTarget` to proper `sla` object with `resolutionTime` and `responseTime`
- Moved `sentiment` inside `aiAnalysis` object
- Fixed priority mapping: `'Critical'` instead of `'Urgent'`
- Ensured `user` field is properly set to `req.user._id`

### 2. Fixed Populate Queries
- Changed `.populate('userId', ...)` to `.populate('user', ...)`
- Updated all references from `complaint.userId` to `complaint.user`

### 3. Fixed Update Schema Fields
- Changed `authorId` to `updatedBy` in updates array
- Changed `type` to `updateType` to match schema

## How to Test

### Step 1: Start the Backend Server
```bash
cd backend
npm start
```

### Step 2: Register a User (if not already registered)
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Step 3: Verify Email with OTP
```bash
# Get OTP from email or server logs
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "YOUR_OTP_HERE"
  }'
```

### Step 4: Login to Get Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Copy the `token` from the response for the next step.**

### Step 5: Create a Complaint
```bash
curl -X POST http://localhost:5001/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Internet connection problem",
    "description": "My internet has been down for the past 2 hours. I have tried restarting the router but it still does not work.",
    "category": "Technical Support"
  }'
```

### Step 6: View User's Complaints
```bash
curl -X GET http://localhost:5001/api/complaints/my-complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 7: Check MongoDB Atlas
1. Go to MongoDB Atlas (https://cloud.mongodb.com)
2. Click on "Browse Collections"
3. Navigate to your database → `complaints` collection
4. You should see the newly created complaint with:
   - `user` field containing the user's ObjectId
   - `title` matching what you entered
   - `description` matching what you entered
   - `status` set to "Open"
   - `complaintId` auto-generated (e.g., "CMP-1732345678123")
   - `sla` object with proper structure
   - `aiAnalysis` object with sentiment

## Expected Response

When complaint is created successfully:

```json
{
  "_id": "64abc123...",
  "user": {
    "_id": "64abc123...",
    "name": "Test User",
    "email": "testuser@example.com"
  },
  "title": "Internet connection problem",
  "description": "My internet has been down for the past 2 hours...",
  "category": "Technical Support",
  "priority": "Medium",
  "status": "Open",
  "complaintId": "CMP-1732345678123",
  "sla": {
    "resolutionTime": {
      "target": 48,
      "actual": null,
      "met": null
    },
    "responseTime": {
      "target": 12,
      "actual": null,
      "met": null
    }
  },
  "aiAnalysis": {
    "sentiment": "Neutral",
    "confidence": 0.7,
    "keywords": [],
    "analyzedAt": "2025-11-22T10:30:00.000Z"
  },
  "createdAt": "2025-11-22T10:30:00.000Z",
  "updatedAt": "2025-11-22T10:30:00.000Z"
}
```

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] User registration works
- [ ] OTP verification works
- [ ] Login returns JWT token
- [ ] Complaint creation returns 201 status
- [ ] Complaint appears in MongoDB Atlas `complaints` collection
- [ ] Complaint has correct `user` field (ObjectId reference)
- [ ] `/api/complaints/my-complaints` shows the created complaint
- [ ] User can see their complaint in the dashboard

## Common Issues

### Issue: "User not found" error
**Solution**: Make sure you're using the correct JWT token from the login response

### Issue: "Validation Error"
**Solution**: Ensure all required fields are provided:
- `title` (required, max 200 chars)
- `description` (required, max 5000 chars)
- `category` (required, must be one of the predefined categories)

### Issue: Complaint not showing in MongoDB
**Solution**: 
1. Check server logs for any MongoDB save errors
2. Verify MongoDB connection string in `.env`
3. Ensure your IP is whitelisted in MongoDB Atlas Network Access
4. Check that `global.DB_CONNECTED` is `true` in health check

### Issue: 401 Unauthorized
**Solution**: 
1. Ensure you included the `Authorization: Bearer TOKEN` header
2. Check that the token hasn't expired (tokens expire after 7 days)
3. Try logging in again to get a fresh token

## Architecture Overview

```
User creates complaint
       ↓
Frontend sends POST to /api/complaints
       ↓
authenticate middleware validates JWT
       ↓
Complaint data validated
       ↓
AI analysis (optional, with fallback)
       ↓
Complaint object created with:
  - user: req.user._id (from JWT)
  - proper sla structure
  - aiAnalysis with sentiment
       ↓
complaint.save() to MongoDB
       ↓
Auto-assign to available agent
       ↓
Send confirmation email
       ↓
Return complaint to frontend
       ↓
User sees complaint in their dashboard
```

## Success Indicators

1. ✅ Complaint saved to MongoDB `complaints` collection
2. ✅ Complaint linked to user via `user` field (ObjectId)
3. ✅ User can retrieve complaint via `/my-complaints` endpoint
4. ✅ Complaint has all required fields populated
5. ✅ No errors in server logs
6. ✅ User receives confirmation email (if email service configured)

All issues have been fixed and the system is ready for testing!
