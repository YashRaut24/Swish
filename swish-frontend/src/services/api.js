import http from './http';
import { STORAGE_KEYS } from '../utils/constants';

const api = {
  async login(credentials) {
    const { data } = await http.post('/auth/login', credentials);
    return data.data; // { user, token }
  },

  async register(payload) {
    const { data } = await http.post('/auth/register', payload);
    return data.data; // { user, token }
  },

  async logout() {
    await http.post('/auth/logout');
    return { logout: true };
  },

  async getUserById(userId) {
    const { data } = await http.get(`/users/${userId}`);
    return data.data; // { user }
  },

  async getPosts(query = '') {
    try {
      const { data } = await http.get(`/posts${query ? `?${query}` : ''}`);
      return data.data || { posts: [] };
    } catch {
      return { posts: [] };
    }
  },

  async createPost(formData) {
    const { data } = await http.post('/posts', formData);
    return data.data; // { post }
  },

  async updatePost(postId, updates) {
    const { data } = await http.patch(`/posts/${postId}`, updates);
    return data.data; // { post }
  },

  async deletePost(postId) {
    const { data } = await http.delete(`/posts/${postId}`);
    return data.data;
  },

  async likePost(postId) {
    const { data } = await http.post(`/posts/${postId}/like`);
    return data.data; // { post }
  },

  async commentOnPost(postId, text) {
    const { data } = await http.post(`/posts/${postId}/comments`, { text });
    return data.data; // { post }
  },

  async updateComment(postId, commentId, text) {
    const { data } = await http.patch(`/posts/${postId}/comments/${commentId}`, { text });
    return data.data; // { post }
  },

  async deleteComment(postId, commentId) {
    const { data } = await http.delete(`/posts/${postId}/comments/${commentId}`);
    return data.data; // { post }
  },

  async getSavedPosts() {
    try {
      const { data } = await http.get('/posts/saved');
      return data.data || { posts: [] };
    } catch {
      return { posts: [] };
    }
  },

  async savePost(postId) {
    const { data } = await http.post(`/posts/${postId}/save`);
    return data.data;
  },

  async unsavePost(postId) {
    const { data } = await http.delete(`/posts/${postId}/save`);
    return data.data;
  },

  async getTrendingHashtags() {
    try {
      const { data } = await http.get('/explore/hashtags');
      return data.data || { hashtags: [] };
    } catch {
      return { hashtags: [] };
    }
  },

  async getMostLikedPosts() {
    try {
      const { data } = await http.get('/explore/top');
      return data.data || { posts: [] };
    } catch {
      return { posts: [] };
    }
  },

  async sharePost(postId) {
    const { data } = await http.post(`/posts/${postId}/share`);
    return data.data;
  },

  async sharePostToUser(postId, recipientId) {
    const { data } = await http.post('/shares', { postId, recipientId });
    return data.data;
  },

  async followUser(userId) {
    const { data } = await http.post(`/users/${userId}/follow`);
    return data.data; // { status }
  },

  async unfollowUser(userId) {
    const { data } = await http.delete(`/users/${userId}/follow`);
    return data.data; // { status }
  },

  async acceptFollow(userId) {
    const { data } = await http.patch(`/users/${userId}/follow/accept`);
    return data.data; // { status }
  },

  async rejectFollow(userId) {
    const { data } = await http.delete(`/users/${userId}/follow/reject`);
    return data.data; // { status }
  },

  async acceptFollowRequest(userId) {
    const { data } = await http.patch(`/users/${userId}/follow/accept`);
    return data.data; // { status }
  },

  async rejectFollowRequest(userId) {
    const { data } = await http.delete(`/users/${userId}/follow/reject`);
    return data.data; // { status }
  },

  async updateProfile(updates) {
    const { data } = await http.patch('/users/me', updates);
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        const merged = { ...JSON.parse(userStr), ...data.data.user };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
      }
    } catch {}
    return data.data; // { user }
  },

  async getChats() {
    try {
      const { data } = await http.get('/chats');
      const payload = data.data || { chats: [] };
      const list = [];
      const me = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
      const myId = me?._id;
      (payload.chats || []).forEach((chat) => {
        const participants = (chat.participants || []).map(p => {
          // Extract _id if it's an object, otherwise use as is
          return typeof p === 'object' ? (p._id || p) : p;
        }).map(String);
        const other = participants.find((id) => id !== String(myId));
        (chat.messages || []).forEach((m) => {
          // Extract sender ID properly
          const senderId = typeof m.sender === 'object' ? String(m.sender._id || m.sender) : String(m.sender);
          const recipientId = String(senderToRecipient(senderId, String(myId), String(other)));
          
          list.push({
            senderId: senderId,
            recipientId: recipientId,
            message: m.text,
            timestamp: m.createdAt,
          });
        });
      });
      return { chats: list };
    } catch {
      return { chats: [] };
    }
  },

  async getNotifications() {
    try {
      const { data } = await http.get('/notifications');
      return data.data || { notifications: [] };
    } catch {
      return { notifications: [] };
    }
  },

  async markNotificationRead(id) {
    const { data } = await http.patch(`/notifications/${id}/read`);
    return data.data; // { read: true }
  },

  async markAllNotificationsRead() {
    const { data } = await http.patch('/notifications/read-all');
    return data.data; // { read: true }
  },

  async sendMessage(recipientId, message, postId = null) {
    const { data } = await http.post('/chats/send', { recipientId, message, postId });
    const me = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    const myId = me?._id;
    const created = data?.data?.created || {};
    if (created?.senderId) return { message: created };
    return { message: { senderId: myId, recipientId, message, timestamp: new Date().toISOString() } };
  },

  async deleteChat(chatId) {
    const { data } = await http.delete(`/chats/${chatId}`);
    return data.data;
  },

  async removeFollower(followerId) {
    const { data } = await http.delete(`/users/${followerId}/followers`);
    return data.data; // { status }
  },

  async markNotificationAsRead(notificationId) {
    const { data } = await http.patch(`/notifications/${notificationId}/read`);
    return data.data;
  },

  async getCommunities() {
    try {
      const { data } = await http.get('/communities');
      return data.data || { communities: [] };
    } catch {
      return { communities: [] };
    }
  },

  async createCommunity(payload) {
    const { data } = await http.post('/communities', payload);
    return data.data;
  },

  async getCommunityById(communityId) {
    const { data } = await http.get(`/communities/${communityId}`);
    return data.data;
  },

  async joinCommunity(communityId) {
    const { data } = await http.post(`/communities/${communityId}/join`);
    return data.data;
  },

  async leaveCommunity(communityId) {
    const { data } = await http.post(`/communities/${communityId}/leave`);
    return data.data;
  },

  async deleteCommunity(communityId) {
    const { data } = await http.delete(`/communities/${communityId}`);
    return data.data;
  },

  async reportPost(postId, reason) {
    const { data } = await http.post('/reports', { postId, reason });
    return data.data;
  },

  async getReports() {
    try {
      const { data } = await http.get('/reports');
      return data.data || { reports: [] };
    } catch {
      return { reports: [] };
    }
  },

  async handleReport(reportId, action) {
    const { data } = await http.patch(`/reports/${reportId}`, { action });
    return data.data; // { report }
  },

  async uploadMedia(files) {
    try {
      const form = new FormData();
      for (const f of files) {
        console.log('Adding file to form:', f.name, f.type, f.size);
        form.append('files', f);
      }
      console.log('Posting to /uploads with', files.length, 'files');
      const { data } = await http.post('/uploads', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      console.log('Upload response:', data);
      return data.data; // { media: [...] }
    } catch (error) {
      console.error('uploadMedia error:', error);
      throw error;
    }
  },

  async searchUsers(query) {
    try {
      const { data } = await http.get(`/search?q=${encodeURIComponent(query)}`);
      return data.data || { users: [], posts: [] };
    } catch (error) {
      console.error('Search error:', error);
      return { users: [], posts: [] };
    }
  },
};

// helper to compute recipient for a message
function senderToRecipient(senderId, myId, otherId) {
  return senderId === myId ? otherId : myId;
}

export default api;