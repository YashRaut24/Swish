# Swish - Complete Features Guide

## ✅ ALL FEATURES NOW FULLY WORKING

### Core Features Implemented:
1. ✅ **User Authentication** - Register, Login, Logout with JWT
2. ✅ **Profile Management** - Edit profile, view others' profiles  
3. ✅ **Posts** - Create, Edit, Delete, Like, Comment
4. ✅ **Real-time Messaging** - Chat with users, Delete chats
5. ✅ **Follow System** - Follow requests, Accept/Reject, Remove followers
6. ✅ **Notifications** - Follow requests with actions, Likes, Comments
7. ✅ **Search** - Search users by username (partial match)
8. ✅ **Explore** - Discover trending posts
9. ✅ **Communities** - Create, Join, Leave communities
10. ✅ **Admin Dashboard** - Manage reports and users

---

## 📖 How to Use Each Feature

### 1. **MESSAGING - Real-time Chat** 🗨️

**How to message someone:**
1. Go to any user's profile
2. Click the **"Message"** button
3. Type your message and click send
4. Messages appear in real-time for both users

**Delete a chat:**
- Go to **Messages** tab
- Hover over a chat
- Click the **×** button
- Confirm deletion

**Key Points:**
- Messages persist in database
- Real-time updates via Socket.IO
- See list of all conversations
- Shows unread message badge

---

### 2. **FOLLOW SYSTEM** 👥

**How to follow someone:**
1. Click on a user's profile
2. Click **"Follow"** button
3. A follow request is sent
4. They see it in their "Follow Requests"

**Accept/Reject requests (on your profile):**
1. Go to your **Profile**
2. Scroll to "Follow Requests" section
3. Click **"Accept"** or **"Reject"**
4. Request immediately clears
5. If accepted, they appear in your followers

**Remove a follower:**
1. Go to your **Profile**
2. Look at "Followers" stat
3. Click to see follower list
4. Remove unwanted followers

**What's shown in Notifications:**
- `follow_request` - Someone wants to follow you
- `follow_accept` - Your request was accepted
- `follow` - They started following you (if public)

---

### 3. **NOTIFICATIONS** 🔔

Click **"Notifications"** in navigation to see:

**Types of notifications:**
- **Follow Requests** - With Accept/Reject buttons
- **Follow Accepted** - When your request is accepted
- **Likes** - When someone likes your post
- **Comments** - When someone comments on your post

**Actions:**
- Click notification to mark as read
- Accept/Reject follow requests directly
- Click "Show" to jump to the relevant post

---

### 4. **SEARCH** 🔍

**Search users:**
1. Click **"Search"** in navigation
2. Type a **username** (e.g., "omk" finds "Omkar mahadik")
3. Results show instantly (partial matching)
4. Click a user to view their profile

**Note:** Search works by username only, not email

---

### 5. **POSTS** 📝

**Create a post:**
1. Click **"What's on your mind?"** box on Home
2. Type your caption
3. Add images (optional)
4. Click "Post"

**Interact with posts:**
- **Like** - Click heart icon
- **Comment** - Click comment icon, type, send
- **Share** - Share with followers
- **Save** - Save for later
- **Delete** - Remove your own posts (3-dot menu)

---

### 6. **PROFILE** 👤

**View your profile:**
1. Click **"Profile"** in navigation
2. Shows your posts, followers, following
3. See pending follow requests

**Edit your profile:**
1. Click **"Edit Profile"** button
2. Update username, bio, profile picture
3. Click "Save"

**View someone else's profile:**
1. Search for them
2. Or click their name on posts/comments
3. See their posts, stats, and details
4. Can follow or message them

---

## 🔄 How Messages Work

### Message Flow:
1. User A sends message to User B
2. Message saved in database
3. Real-time notification via Socket.IO
4. Message appears in User B's chat
5. Both see message history when reopening chat

### Database Storage:
- Chats stored in "Chat" collection
- Each chat has 2 participants (one-on-one)
- Messages array stores all messages
- Includes sender, text, and timestamp

### Real-time Updates:
- Socket.IO connections authenticated with JWT
- Each user joins their own socket room (by user ID)
- Messages broadcast to both participants' rooms
- Instant delivery when both online

---

## 🔄 How Follow System Works

### Follow Request Flow:
1. User A clicks "Follow" on User B's profile
2. Follow request sent to User B
3. Notification appears in User B's notifications
4. User B sees it in Profile > Follow Requests
5. User B can Accept or Reject

### After Accepting:
- User A appears in User B's followers
- User B appears in User A's following
- Follow request clears
- Notification sent back to User A (follow_accept)

### After Rejecting:
- Follow request is deleted
- Requester is not notified they were rejected
- They can send another request later

### Removing Followers:
- From your profile, remove unwanted followers
- They no longer see your posts
- Not notified of removal

---

## 📊 API Endpoints Summary

### Chat Endpoints
```
POST   /api/chats/send          - Send message
GET    /api/chats               - Get all chats
DELETE /api/chats/:chatId       - Delete a chat
```

### Follow Endpoints
```
POST   /api/users/:id/follow              - Send follow request
DELETE /api/users/:id/follow              - Unfollow/cancel request
PATCH  /api/users/:id/follow/accept       - Accept request
DELETE /api/users/:id/follow/reject       - Reject request
DELETE /api/users/:id/followers           - Remove follower
```

### Notification Endpoints
```
GET    /api/notifications                 - Get all notifications
PATCH  /api/notifications/:id/read        - Mark as read
PATCH  /api/notifications/read-all        - Mark all as read
```

---

## 🐛 Common Issues & Fixes

### Messages not appearing?
- **Check:** Both users are logged in
- **Check:** Socket.IO connection is active
- **Fix:** Refresh the page
- **Fix:** Restart backend server

### Follow request not clearing?
- **Issue:** Still shows in pending list after accepting
- **Fix:** Refresh your profile page
- **Fix:** Clear browser cache and reload

### Chat showing wrong username?
- **Issue:** Shows "[object Object]"
- **Status:** ✅ FIXED in latest version
- **Fix:** Ensure you have the latest code

### Search not finding users?
- **Issue:** Only searches by username (not email)
- **Tip:** Type partial username like "omk" for "Omkar"
- **Note:** Case-insensitive search

---

## 🚀 Backend Commands

```bash
# Start backend (from backend folder)
npm run dev

# Build for production
npm run build

# Run production
npm start
```

## 🎨 Frontend Commands

```bash
# Start frontend (from swish-frontend folder)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Environment Variables Required

### Backend (.env)
```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Swish
```

---

## 📝 Notes

- All features have been tested and are working
- Messages are persistent and saved in database
- Follow requests clearly show pending status
- Socket.IO enables real-time updates
- JWT ensures secure authentication
- No demo accounts needed - create your own!

---

**Last Updated:** January 14, 2026
**Status:** ✅ Production Ready
