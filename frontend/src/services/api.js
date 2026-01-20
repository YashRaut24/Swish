import http from './http';
import { STORAGE_KEYS } from '../utils/constants';

const api = {
  async login(credentials) {
    const { data } = await http.post('/auth/login', credentials);
    return data.data; 
  },

  async register(payload) {
    const { data } = await http.post('/auth/register', payload);
    return data.data; 
  },

  async logout() {
    await http.post('/auth/logout');
    return { logout: true };
  },

  async getUserById(userId) {
    const { data } = await http.get(`/users/${userId}`);
    return data.data; 
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
    return data.data; 
  },

  async updatePost(postId, updates) {
    const { data } = await http.patch(`/posts/${postId}`, updates);
    return data.data; 
  },

  async deletePost(postId) {
    const { data } = await http.delete(`/posts/${postId}`);
    return data.data;
  },

  async likePost(postId) {
    const { data } = await http.post(`/posts/${postId}/like`);
    return data.data; 
  },

  async commentOnPost(postId, text) {
    const { data } = await http.post(`/posts/${postId}/comments`, { text });
    return data.data; 
  },

  async updateComment(postId, commentId, text) {
    const { data } = await http.patch(`/posts/${postId}/comments/${commentId}`, { text });
    return data.data; 
  },

  async deleteComment(postId, commentId) {
    const { data } = await http.delete(`/posts/${postId}/comments/${commentId}`);
    return data.data; 
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
    return data.data; 
  },

  async unfollowUser(userId) {
    const { data } = await http.delete(`/users/${userId}/follow`);
    return data.data; 
  },

  async acceptFollow(userId) {
    const { data } = await http.patch(`/users/${userId}/follow/accept`);
    return data.data; 
  },

  async rejectFollow(userId) {
    const { data } = await http.delete(`/users/${userId}/follow/reject`);
    return data.data; 
  },

  async acceptFollowRequest(userId) {
    const { data } = await http.patch(`/users/${userId}/follow/accept`);
    return data.data; 
  },

  async rejectFollowRequest(userId) {
    const { data } = await http.delete(`/users/${userId}/follow/reject`);
    return data.data; 
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
    return data.data; 
  },

  async getChats() {
    try {
      const { data } = await http.get('/chats');
      return data.data || { chats: [] };
    } catch {
      return { chats: [] };
    }
  },

  async getCommunityPosts() {
    try {
      const { data } = await http.get('/posts/community');
      return data.data || { posts: [] };
    } catch {
      return { posts: [] };
    }
  },

  async getCommunityChats() {
    try {
      const { data } = await http.get('/chats/community');
      const payload = data.data || { chats: [] };
      const list = [];
      const me = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
      const myId = me?._id;
      (payload.chats || []).forEach((chat) => {
        const participants = (chat.participants || []).map(p => {
          
          return typeof p === 'object' ? (p._id || p) : p;
        }).map(String);
        const other = participants.find((id) => id !== String(myId));
        (chat.messages || []).forEach((m) => {
          
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
    return data.data; 
  },

  async markAllNotificationsRead() {
    const { data } = await http.patch('/notifications/read-all');
    return data.data; 
  },

  async sendMessage(recipientId, message, postId = null) {
    const { data } = await http.post('/chats/send', { recipientId, message, postId });
    const me = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    const myId = me?._id;
    const created = data?.data?.created || {};
    if (created?.senderId) return { message: { senderId: created.senderId, recipientId: created.recipientId, message: created.text, timestamp: created.timestamp } };
    return { message: { senderId: myId, recipientId, message, timestamp: new Date().toISOString() } };
  },

  async markChatAsRead(chatId) {
    const { data } = await http.patch(`/chats/${chatId}/read`);
    return data.data;
  },

  async deleteChat(chatId) {
    const { data } = await http.delete(`/chats/${chatId}`);
    return data.data;
  },

  async removeFollower(followerId) {
    const { data } = await http.delete(`/users/${followerId}/followers`);
    return data.data; 
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

  async getCommunityStatus() {
    try {
      const { data } = await http.get('/users/me/community-status');
      return data.data || { followedCommunities: [], joinRequests: [] };
    } catch {
      return { followedCommunities: [], joinRequests: [] };
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

  async followCommunity(communityId) {
    const { data } = await http.post(`/communities/${communityId}/follow`);
    return data.data;
  },

  async approveJoinRequest(communityId, userId) {
    const { data } = await http.post(`/communities/${communityId}/approve/${userId}`);
    return data.data;
  },

  async rejectJoinRequest(communityId, userId) {
    const { data } = await http.post(`/communities/${communityId}/reject/${userId}`);
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
    return data.data; 
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
      return data.data; 
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

  
  
  
  async getEvents() {
    try {
      const { data } = await http.get('/events');
      return data.data || { events: [] };
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return { events: [] };
    }
  },

  async getEventById(eventId) {
    try {
      const { data } = await http.get(`/events/${eventId}`);
      return data.data || { event: null, posts: [] };
    } catch (error) {
      console.error('Failed to fetch event:', error);
      return { event: null, posts: [] };
    }
  },

  async createEvent(eventData) {
    const { data } = await http.post('/events', eventData);
    return data.data; 
  },

  async updateEvent(eventId, updates) {
    const { data } = await http.patch(`/events/${eventId}`, updates);
    return data.data; 
  },

  async deleteEvent(eventId) {
    const { data } = await http.delete(`/events/${eventId}`);
    return data.data;
  },

  async joinEvent(eventId) {
    const { data } = await http.post(`/events/${eventId}/join`);
    return data.data; 
  },

  async leaveEvent(eventId) {
    const { data } = await http.post(`/events/${eventId}/leave`);
    return data.data; 
  },

  async approveEvent(eventId) {
    const { data } = await http.patch(`/events/${eventId}/approve`);
    return data.data; 
  },

  
  async createCommunity(payload) {
    const { data } = await http.post('/communities', payload);
    return data.data;
  },

  
  async hidePost(postId) {
    const { data } = await http.patch(`/posts/${postId}/hide`);
    return data.data; 
  },

  async unHidePost(postId) {
    const { data } = await http.patch(`/posts/${postId}/unhide`);
    return data.data; 
  },

  async muteStudent(userId) {
    const { data } = await http.post(`/users/${userId}/mute`);
    return data.data; 
  },

  async unmuteStudent(userId) {
    const { data } = await http.delete(`/users/${userId}/mute`);
    return data.data; 
  },

  async priorityReport(postId, reason) {
    const { data } = await http.post(`/posts/${postId}/report`, { reason });
    return data.data; 
  },

  
  async sendBroadcast(message, target) {
    const { data } = await http.post('/broadcasts', { message, target });
    return data.data; 
  },

  async getBroadcasts() {
    try {
      const { data } = await http.get('/broadcasts');
      return data.data || { broadcasts: [] };
    } catch {
      return { broadcasts: [] };
    }
  },
};


function senderToRecipient(senderId, myId, otherId) {
  return senderId === myId ? otherId : myId;
}

export default api;
