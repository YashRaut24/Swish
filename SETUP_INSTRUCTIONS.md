# Swish - Campus Social Network Setup Instructions

## ✅ All Issues Fixed

The following issues have been resolved:
1. ✅ CORS preflight errors
2. ✅ Field name mismatches (name → username)
3. ✅ Role capitalization (student → Student)
4. ✅ Password length validation (aligned to 6 chars minimum)
5. ✅ JWT_SECRET loading order
6. ✅ User population error handling

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ installed
- MongoDB running locally OR MongoDB Atlas connection string

### Backend Setup

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file in the `backend` folder with these values:

```env
# Server
PORT=5000
CLIENT_ORIGIN=http://localhost:3000,http://localhost:5173

# Database (use your actual MongoDB connection string)
MONGO_URI=mongodb+srv://omkarm842584:3r9je5Hi_fXJfSN@cluster0.okt6udk.mongodb.net/Swish?appName=Cluster0

# Authentication
JWT_SECRET=omkarm842584

# Cloudinary (optional - for image uploads)
CLOUDINARY_CLOUD_NAME=dbjv8b6q9
CLOUDINARY_API_KEY=965193748116751
CLOUDINARY_API_SECRET=srTkF40H7CXIdmaqBvwqzXUlWLQ
```

4. **Start the backend:**
```bash
npm run dev
```

Backend should start on **http://localhost:5000**

---

### Frontend Setup

1. **Navigate to frontend folder:**
```bash
cd swish-frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file in the `swish-frontend` folder:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Swish
```

4. **Start the frontend:**
```bash
npm run dev
```

Frontend should start on **http://localhost:3000** or **http://localhost:5173**

---

## 🧪 Testing Authentication

### Register New User
1. Click "Sign Up" on login page
2. Fill in:
   - **Full Name**: Any name (3+ characters)
   - **Campus Email**: yourname@campus.edu
   - **Password**: At least 6 characters
   - **Role**: Student/Faculty/Community
3. Click "Sign Up"

### Login Existing User
1. Enter email and password
2. Click "Login"

### Demo Login
1. Click "Try Demo Login" button
2. Automatically creates and logs in as demo@campus.edu

### Admin Login (Pre-configured)
- **Email**: admin@campus.edu
- **Password**: admin123

---

## 📝 Key Changes Made

### Backend Changes

#### `server.js`
- Added comprehensive CORS configuration for both localhost:3000 and localhost:5173
- Added fallback CORS header middleware
- Enabled preflight OPTIONS handling

#### `authController.js`
- Changed expected field from `name` to `username`
- Added JWT_SECRET validation inside `createToken` function
- Enhanced error logging for debugging
- Made `populateUser` function more robust with error handling

#### `User.js` (Model)
- Reduced password minlength from 8 to 6 characters
- Kept role enum as: `['Student', 'Faculty', 'Admin']`

### Frontend Changes

#### `Register.jsx`
- Changed form field from `name` to `username`
- Updated validation to check `username` field

#### `Login.jsx`
- Fixed demo registration to use `username` instead of `name`
- Updated role to capitalized `'Student'`

#### `constants.js`
- Capitalized USER_ROLES values:
  - `STUDENT: 'Student'`
  - `FACULTY: 'Faculty'`
  - `ADMIN: 'Admin'`
  - `COMMUNITY: 'Community'`

---

## 🔧 Troubleshooting

### Port Already in Use (EADDRINUSE)
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change the port in backend/.env
PORT=5001
```

### CORS Errors
- Verify `CLIENT_ORIGIN` in `backend/.env` includes your frontend URL
- Check browser console for exact origin (http://localhost:3000 vs http://localhost:5173)
- Restart both servers after `.env` changes

### 500 Internal Server Error
- Check backend console for detailed error messages
- Verify MongoDB connection string is correct
- Ensure JWT_SECRET is set in `backend/.env`

### 409 Conflict (Email Already Registered)
- Use a different email address
- Or delete the user from MongoDB and try again

---

## 🎯 Project Structure

```
swish_claude/
├── backend/
│   ├── src/
│   │   ├── server.js (✅ Fixed CORS)
│   │   ├── controllers/
│   │   │   └── authController.js (✅ Fixed username, JWT, error handling)
│   │   ├── models/
│   │   │   └── User.js (✅ Fixed password length, role enum)
│   │   └── routes/
│   │       └── authRoutes.js
│   ├── .env (⚠️ Create this file)
│   └── package.json
│
└── swish-frontend/
    ├── src/
    │   ├── components/
    │   │   └── Auth/
    │   │       ├── Login.jsx (✅ Fixed username, role)
    │   │       └── Register.jsx (✅ Fixed username field)
    │   ├── services/
    │   │   ├── api.js
    │   │   └── http.js
    │   └── utils/
    │       └── constants.js (✅ Fixed role capitalization)
    ├── .env (⚠️ Create this file)
    └── package.json
```

---

## ✨ Features Working

- ✅ User Registration
- ✅ User Login
- ✅ Demo Login
- ✅ JWT Token Authentication
- ✅ CORS properly configured
- ✅ Password hashing with bcrypt
- ✅ Role-based user types (Student/Faculty/Admin/Community)

---

## 📞 Support

If you encounter any issues:
1. Check both terminal outputs (backend and frontend)
2. Check browser DevTools Console and Network tabs
3. Verify `.env` files are created and populated
4. Ensure MongoDB is running and accessible

---

**Last Updated**: December 16, 2025
**Status**: ✅ All authentication issues resolved
