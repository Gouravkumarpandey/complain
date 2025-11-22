# Complete Complaint Tracking System - Implementation Guide

## ✅ What Has Been Implemented

### 1. **Username System**
Every user now gets a **unique username** automatically generated when they register:
- Username is created from email (part before @)
- If username exists, numbers are added (e.g., `johnsmith`, `johnsmith1`, `johnsmith2`)
- Username is stored in the database and returned in all user responses

### 2. **Complaint-User Linking**
Every complaint is linked to the user who created it:
- Complaint stores `user` field (MongoDB ObjectId reference)
- Complaint stores `complaintId` (unique ID like `CMP-1732345678123`)
- User ID and Complaint ID are linked in the database

### 3. **User Complaint History**
Users can view ALL their registered complaints when they log in:
- Endpoint: `GET /api/complaints/my-complaints`
- Shows all complaints created by the logged-in user
- Includes filters, pagination, and statistics
- Works like Accenture job portal (see all applications)

## 📋 Database Schema

### User Schema (with username)
```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  username: "johndoe",        // ← NEW: Unique username
  email: "john@example.com",
  password: "hashed...",
  role: "user",
  isVerified: true,
  createdAt: "2025-11-22T10:00:00Z"
}
```

### Complaint Schema (linked to user)
```javascript
{
  _id: ObjectId("..."),
  user: ObjectId("..."),      // ← Links to User._id
  complaintId: "CMP-1732345678123",  // ← Unique complaint ID
  title: "Internet not working",
  description: "My internet has been down...",
  category: "Technical Support",
  priority: "Medium",
  status: "Open",
  createdAt: "2025-11-22T10:30:00Z"
}
```

## 🚀 How It Works

### Registration Flow
```
1. User registers with name, email, password
   ↓
2. System generates unique username from email
   - email: "john.smith@example.com"
   - username: "johnsmith" (or "johnsmith1" if taken)
   ↓
3. User is saved to database with username
   ↓
4. OTP is sent for email verification
   ↓
5. User verifies and can now login
```

### Complaint Creation Flow
```
1. User logs in (gets JWT token with user ID)
   ↓
2. User creates complaint
   ↓
3. System extracts user ID from JWT token (req.user._id)
   ↓
4. Complaint is saved with:
   - user: req.user._id (links to user)
   - complaintId: "CMP-..." (unique ID)
   - All other complaint details
   ↓
5. User receives confirmation
   ↓
6. Complaint is stored in MongoDB 'complaints' collection
```

### Viewing Complaint History
```
1. User logs in again (after logout)
   ↓
2. User navigates to "My Complaints" page
   ↓
3. Frontend calls GET /api/complaints/my-complaints
   ↓
4. Backend filters complaints where user = logged-in user's ID
   ↓
5. All user's complaints are returned with:
   - Complaint details
   - Status (Open, In Progress, Resolved, etc.)
   - Statistics (total, open, resolved)
   ↓
6. User sees complete complaint history
```

## 📡 API Endpoints

### 1. Register User (with auto-generated username)
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email with the OTP sent to your inbox.",
  "user": {
    "id": "673f5a1b2c3d4e5f6g7h8i9j",
    "name": "John Doe",
    "username": "john",         ← Auto-generated username
    "email": "john@example.com",
    "role": "user",
    "isVerified": false
  },
  "requiresVerification": true
}
```

### 2. Login (returns user with username)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "673f5a1b2c3d4e5f6g7h8i9j",
    "name": "John Doe",
    "username": "john",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. Create Complaint (automatically linked to user)
```http
POST /api/complaints
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Internet connection problem",
  "description": "My internet has been down for 2 hours. Router restart didn't help.",
  "category": "Technical Support"
}
```

**Response:**
```json
{
  "_id": "673f5b2c3d4e5f6g7h8i9j0k",
  "user": {
    "_id": "673f5a1b2c3d4e5f6g7h8i9j",
    "name": "John Doe",
    "username": "john",
    "email": "john@example.com"
  },
  "complaintId": "CMP-1732345678123",
  "title": "Internet connection problem",
  "description": "My internet has been down for 2 hours...",
  "category": "Technical Support",
  "priority": "Medium",
  "status": "Open",
  "sla": {
    "resolutionTime": {
      "target": 48,
      "actual": null,
      "met": null
    }
  },
  "createdAt": "2025-11-22T10:30:00.000Z"
}
```

### 4. Get User's Complaint History
```http
GET /api/complaints/my-complaints?page=1&limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "673f5a1b2c3d4e5f6g7h8i9j",
    "name": "John Doe",
    "username": "john",
    "email": "john@example.com",
    "role": "user"
  },
  "complaints": [
    {
      "_id": "673f5b2c3d4e5f6g7h8i9j0k",
      "complaintId": "CMP-1732345678123",
      "title": "Internet connection problem",
      "description": "My internet has been down...",
      "category": "Technical Support",
      "priority": "Medium",
      "status": "Open",
      "user": {
        "_id": "673f5a1b2c3d4e5f6g7h8i9j",
        "name": "John Doe",
        "username": "john",
        "email": "john@example.com"
      },
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z"
    },
    {
      "_id": "673f5c3d4e5f6g7h8i9j0k1l",
      "complaintId": "CMP-1732346789234",
      "title": "Billing issue",
      "description": "I was charged twice...",
      "category": "Billing",
      "priority": "High",
      "status": "In Progress",
      "user": {
        "_id": "673f5a1b2c3d4e5f6g7h8i9j",
        "name": "John Doe",
        "username": "john",
        "email": "john@example.com"
      },
      "createdAt": "2025-11-21T15:20:00.000Z",
      "updatedAt": "2025-11-22T09:15:00.000Z"
    }
  ],
  "stats": {
    "total": 5,
    "open": 2,
    "inProgress": 1,
    "resolved": 2,
    "closed": 0
  },
  "pagination": {
    "current": 1,
    "pages": 1,
    "total": 5,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 5. Filter User's Complaints
```http
GET /api/complaints/my-complaints?status=Open&category=Technical Support
Authorization: Bearer {token}
```

## 🧪 Testing the Complete Flow

### Step 1: Register a New User
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

**Expected Result:**
- User created with auto-generated username (e.g., "testuser")
- OTP sent to email
- User saved in MongoDB 'users' collection

### Step 2: Verify OTP
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "123456"
  }'
```

### Step 3: Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Copy the JWT token from response!**

### Step 4: Create First Complaint
```bash
curl -X POST http://localhost:5001/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My first complaint",
    "description": "This is a test complaint to verify the system works",
    "category": "Technical Support"
  }'
```

**Expected Result:**
- Complaint created and saved to MongoDB
- Complaint linked to user via `user` field
- Complaint ID generated (e.g., CMP-1732345678123)

### Step 5: Create More Complaints
```bash
# Complaint 2
curl -X POST http://localhost:5001/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Billing issue",
    "description": "I was charged twice for last month",
    "category": "Billing"
  }'

# Complaint 3
curl -X POST http://localhost:5001/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Product quality concern",
    "description": "The product I received is damaged",
    "category": "Product Quality"
  }'
```

### Step 6: View All User's Complaints
```bash
curl -X GET http://localhost:5001/api/complaints/my-complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Result:**
- All 3 complaints returned
- Each complaint has user information
- Statistics show: total=3, open=3
- User can see all complaints they registered

### Step 7: Simulate Logout and Re-login
```bash
# Login again (simulating re-login after logout)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'

# Get new token and view complaints again
curl -X GET http://localhost:5001/api/complaints/my-complaints \
  -H "Authorization: Bearer NEW_TOKEN_HERE"
```

**Expected Result:**
- User logs in successfully
- All previous complaints are still visible
- System remembers complaint history

## ✅ Verification Checklist

After testing, verify in MongoDB Atlas:

1. **Users Collection:**
   - [ ] User has `username` field
   - [ ] Username is unique
   - [ ] User has `_id` (ObjectId)

2. **Complaints Collection:**
   - [ ] Each complaint has `user` field (ObjectId reference)
   - [ ] Each complaint has unique `complaintId`
   - [ ] `user` field matches the user's `_id`

3. **API Responses:**
   - [ ] Register returns username
   - [ ] Login returns username
   - [ ] Create complaint links to user
   - [ ] My-complaints shows all user's complaints
   - [ ] After logout/login, complaints are still visible

## 🔍 How to Verify in MongoDB Atlas

1. Go to MongoDB Atlas → Browse Collections
2. Select `complaintsdb` database
3. Click on `users` collection
   - Find your user
   - Verify `username` field exists
   - Copy the `_id` value

4. Click on `complaints` collection
   - Find complaints created by your user
   - Verify each complaint has `user` field
   - Verify `user` field value matches your user's `_id`

## 🎯 Key Features

### ✅ Implemented:
1. **Automatic Username Generation** - Every user gets a unique username
2. **Complaint-User Linking** - Every complaint is linked to creator via user ID
3. **Complete Complaint History** - Users can view all their complaints anytime
4. **Persistent History** - Complaints remain visible after logout/login
5. **Statistics** - Users see summary (total, open, resolved, etc.)
6. **Filtering** - Users can filter by status, category, priority
7. **Pagination** - Handle large number of complaints efficiently

### 🔐 Security:
- Users can only see THEIR complaints (not others')
- JWT token required for all complaint operations
- User ID extracted from token (can't be faked)
- Database enforces user-complaint relationships

### 📊 Similar to Accenture Job Portal:
- User applies for jobs → Stored in database
- User logs out
- User logs back in
- User sees all job applications with status

**Same concept here:**
- User registers complaint → Stored in database with user ID
- User logs out
- User logs back in
- User sees all complaints with status

## 🚀 All Systems Working!

The backend server is now running with:
- ✅ Username generation on registration
- ✅ Complaint-user linking on creation
- ✅ My-complaints endpoint for viewing history
- ✅ Proper data persistence in MongoDB
- ✅ Complete tracking system

**Your complaint tracking system is now fully functional!** 🎉
