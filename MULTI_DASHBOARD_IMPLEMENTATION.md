# Multi-Dashboard System Implementation Guide

## Overview
This document explains the implementation of a multi-dashboard system where users are segregated by roles into separate MongoDB collections, and complaints are properly linked to users with a complete history tracking system.

## System Architecture

### Database Structure
The system uses **MongoDB Atlas** with the following collections:

```
complaintsdb (main database)
├── users          (Regular users - customers filing complaints)
├── admin          (Admin users - system administrators)
├── agent          (Agent users - support staff handling complaints)
├── analytics      (Analytics users - data analysts viewing reports)
├── complaints     (All complaints with user references)
├── notifications  (System notifications)
├── account        (Account-related data)
└── organizations  (Organization details)
```

### Key Features Implemented

#### 1. **Role-Based User Segregation**
Users are automatically stored in different collections based on their role:
- **User role** → `users` collection
- **Admin role** → `admin` collection
- **Agent role** → `agent` collection
- **Analytics role** → `analytics` collection

#### 2. **Cross-Collection User Search**
The system can find users across all collections for authentication and operations:
- `findUserByEmail(email)` - Searches all collections by email
- `findUserById(userId)` - Searches all collections by ID
- `getUserModelByRole(role)` - Returns the appropriate model for a role

#### 3. **Complaint-User Linking**
Every complaint is linked to its creator via the `user` field (ObjectId reference):
```javascript
{
  user: ObjectId("..."),  // Reference to user who created the complaint
  title: "Internet not working",
  description: "...",
  status: "Open",
  // ... other fields
}
```

#### 4. **User Complaint History**
Users can view all their complaints (like Accenture job application history):
- Endpoint: `GET /api/complaints/my-complaints`
- Features:
  - Pagination support
  - Filtering by status, category, priority
  - Sorting options
  - Statistics (total, open, resolved, etc.)

## API Endpoints

### Authentication Endpoints

#### Register User (with role selection)
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // Options: "user", "admin", "agent", "analytics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email with the OTP sent to your inbox.",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": false
  },
  "requiresVerification": true
}
```

#### Login
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
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Complaint Endpoints

#### Create Complaint
```http
POST /api/complaints
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Internet connection issue",
  "description": "My internet has been down for 2 hours",
  "category": "Technical Support",
  "attachments": []
}
```

**Response:**
```json
{
  "_id": "...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "title": "Internet connection issue",
  "description": "My internet has been down for 2 hours",
  "category": "Technical Support",
  "priority": "Medium",
  "status": "Open",
  "complaintId": "CMP-1732345678123",
  "createdAt": "2025-11-22T10:30:00Z",
  "updatedAt": "2025-11-22T10:30:00Z"
}
```

#### Get User's Complaint History
```http
GET /api/complaints/my-complaints?page=1&limit=10&status=Open
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "complaints": [
    {
      "_id": "...",
      "title": "Internet connection issue",
      "description": "My internet has been down for 2 hours",
      "status": "Open",
      "priority": "Medium",
      "category": "Technical Support",
      "complaintId": "CMP-1732345678123",
      "user": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-11-22T10:30:00Z",
      "updatedAt": "2025-11-22T10:30:00Z"
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

## How It Works

### User Registration Flow

1. **User submits registration** with name, email, password, and role
2. **System validates** the input and checks for existing users across all collections
3. **System selects appropriate collection** based on role:
   ```javascript
   const UserModel = getUserModelByRole(role);
   // Returns: User, AdminUser, AgentUser, or AnalyticsUser model
   ```
4. **User is created** in the role-specific collection
5. **OTP is sent** for email verification
6. **User verifies email** and can then log in

### Login Flow

1. **User submits credentials**
2. **System searches** across all collections using `findUserByEmail(email)`
3. **Password is verified** using bcrypt
4. **JWT token is generated** with user ID
5. **User dashboard is determined** based on their role:
   - `role: 'user'` → User Dashboard
   - `role: 'agent'` → Agent Dashboard
   - `role: 'admin'` → Admin Dashboard
   - `role: 'analytics'` → Analytics Dashboard

### Complaint Creation Flow

1. **User is authenticated** via JWT token
2. **User ID is extracted** from token and added to complaint:
   ```javascript
   const complaint = new Complaint({
     user: req.user._id,  // Linked to authenticated user
     title,
     description,
     category,
     // ... other fields
   });
   ```
3. **Complaint is saved** to `complaints` collection
4. **Confirmation email** is sent to user
5. **Complaint is auto-assigned** to an available agent (if configured)

### Viewing Complaint History

1. **User requests** their complaint history via `/api/complaints/my-complaints`
2. **System filters** complaints where `user` field matches authenticated user's ID:
   ```javascript
   const filter = { user: req.user._id };
   ```
3. **Complaints are fetched** with populated user and agent details
4. **Statistics are calculated** (total, open, resolved, etc.)
5. **Paginated response** is returned to user

## MongoDB Atlas Setup

### Required Collections
Ensure your MongoDB Atlas cluster has these collections:
- `users` (auto-created on first user registration)
- `admin` (auto-created on first admin registration)
- `agent` (auto-created on first agent registration)
- `analytics` (auto-created on first analytics user registration)
- `complaints` (auto-created on first complaint)
- `notifications` (for system notifications)

### Connection String
Update your `.env` file with your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/complaintsdb?retryWrites=true&w=majority
```

### Network Access
Ensure your IP address is whitelisted in MongoDB Atlas:
1. Go to MongoDB Atlas → Network Access
2. Add your current IP or use `0.0.0.0/0` for development (not recommended for production)

## Frontend Integration

### Registration Form
```javascript
// Example: User registration with role selection
const registerUser = async (formData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role  // 'user', 'admin', 'agent', 'analytics'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // Redirect to OTP verification page
    navigate('/verify-otp', { state: { email: formData.email } });
  }
};
```

### Creating a Complaint
```javascript
const createComplaint = async (complaintData) => {
  const response = await fetch('/api/complaints', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(complaintData)
  });
  
  const data = await response.json();
  if (data._id) {
    // Complaint created successfully
    console.log('Complaint ID:', data.complaintId);
  }
};
```

### Viewing Complaint History
```javascript
const fetchMyComplaints = async () => {
  const response = await fetch('/api/complaints/my-complaints?page=1&limit=10', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  const data = await response.json();
  if (data.success) {
    setComplaints(data.complaints);
    setStats(data.stats);
    setPagination(data.pagination);
  }
};
```

## Benefits of This Implementation

### 1. **Clear Data Separation**
- Each user role has its own collection in MongoDB Atlas
- Easy to visualize in MongoDB Atlas cluster view
- Simplifies role-based queries and analytics

### 2. **Scalability**
- Collections can be independently indexed and optimized
- Easier to implement role-specific features
- Better query performance

### 3. **Security**
- Role-based access control at database level
- Users can only access their own complaints
- Agents see only assigned complaints
- Admins have full visibility

### 4. **User Experience**
- Users can track all their complaints (like Accenture job portal)
- Real-time status updates
- Complete complaint history with statistics
- Easy filtering and searching

### 5. **Maintainability**
- Clear separation of concerns
- Easier debugging and testing
- Better code organization

## Testing the Implementation

### 1. Test User Registration
```bash
# Register as a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "user"
  }'

# Register as an agent
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "email": "testagent@example.com",
    "password": "password123",
    "role": "agent"
  }'
```

### 2. Verify MongoDB Collections
Check MongoDB Atlas to see:
- `users` collection contains the user
- `agent` collection contains the agent

### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

### 4. Test Complaint Creation
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Complaint",
    "description": "This is a test complaint",
    "category": "Technical Support"
  }'
```

### 5. Test Complaint History
```bash
curl -X GET http://localhost:5000/api/complaints/my-complaints \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Issue: Users not appearing in separate collections
**Solution:** Check that you're using the correct role during registration. The role must be exactly one of: `'user'`, `'admin'`, `'agent'`, `'analytics'`

### Issue: Complaint not linked to user
**Solution:** Ensure the JWT token is valid and the middleware is correctly extracting `req.user._id`

### Issue: Cannot find user during login
**Solution:** The `findUserByEmail` helper searches all collections. Verify the email is correct and the user was successfully created.

### Issue: MongoDB connection error
**Solution:** 
1. Check your MongoDB Atlas connection string in `.env`
2. Verify your IP is whitelisted in Network Access
3. Ensure your MongoDB Atlas cluster is running

## Security Considerations

1. **Password Hashing:** All passwords are hashed with bcrypt before storage
2. **JWT Tokens:** Use strong JWT secrets and implement token expiration
3. **Role Validation:** Roles are validated on registration and checked on every request
4. **Input Validation:** All user inputs are validated before database operations
5. **Email Verification:** Users must verify their email via OTP before full access

## Future Enhancements

1. **Role Migration:** Allow admins to change user roles (moves user to different collection)
2. **Advanced Analytics:** Role-specific analytics dashboards
3. **Complaint Templates:** Pre-defined complaint templates for common issues
4. **Real-time Notifications:** WebSocket integration for live complaint updates
5. **Multi-language Support:** Internationalization for global users

## Conclusion

This multi-dashboard system provides:
- ✅ Clear user segregation by roles
- ✅ Proper complaint-user linking
- ✅ Complete complaint history tracking
- ✅ Scalable architecture
- ✅ Enhanced security
- ✅ Better user experience (similar to Accenture portal)

All changes have been implemented and are ready for testing!
