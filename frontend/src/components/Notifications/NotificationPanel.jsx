import React, { useState } from 'react';
import { Heart, MessageCircle, UserPlus, Bell, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NotificationPanel = ({ onUserClick, onPostClick }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const { user, isFaculty } = useAuth();
  const [filter, setFilter] = useState('all'); // all, unread

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
      case 'follow_request':
      case 'follow_accept':
        return <UserPlus size={20} className="text-green-500" />;
      case 'community_join_request':
        return <UserPlus size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="bg-white rounded-xl shadow-md h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div>
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <button
                        className="font-semibold hover:text-purple-600"
                        onClick={(e) => { e.stopPropagation(); onUserClick && onUserClick(notification.actor?._id); }}
                      >
                        {notification.actor?.username || 'Someone'}
                      </button>
                      {notification.type === 'like' && ' liked your '}
                      {notification.type === 'comment' && ' commented on your '}
                      {notification.type === 'follow' && ' started following you'}
                      {notification.type === 'follow_request' && ' wants to follow you'}
                      {notification.type === 'follow_accept' && ' accepted your follow request'}
                      {notification.type === 'community_join_request' && ` wants to join ${notification.community?.name || 'the community'}`}
                      {notification.type === 'community_join_accept' && ` accepted your request to join ${notification.community?.name || 'the community'}`}
                      {(notification.type === 'like' || notification.type === 'comment') && (
                        <button
                          className="ml-1 underline hover:text-purple-600"
                          onClick={(e) => { e.stopPropagation(); onPostClick && onPostClick(notification.post?._id); }}
                        >
                          post
                        </button>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                    
                    {/* Accept/Reject buttons for follow requests */}
                    {notification.type === 'follow_request' && !notification.read && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Extract actor ID safely
                              let actorId;
                              if (typeof notification.actor === 'string') {
                                actorId = notification.actor;
                              } else if (notification.actor && notification.actor._id) {
                                actorId = typeof notification.actor._id === 'string'
                                  ? notification.actor._id
                                  : notification.actor._id.toString();
                              } else {
                                throw new Error('Invalid actor ID format');
                              }

                              await api.acceptFollowRequest(actorId);
                              await markAsRead(notification._id); // Mark as read after acceptance
                            } catch (error) {
                              console.error('Failed to accept request:', error);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Extract actor ID safely
                              let actorId;
                              if (typeof notification.actor === 'string') {
                                actorId = notification.actor;
                              } else if (notification.actor && notification.actor._id) {
                                actorId = typeof notification.actor._id === 'string'
                                  ? notification.actor._id
                                  : notification.actor._id.toString();
                              } else {
                                throw new Error('Invalid actor ID format');
                              }

                              await api.rejectFollowRequest(actorId);
                              // Context will update automatically
                            } catch (error) {
                              console.error('Failed to reject request:', error);
                            }
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Accept/Reject buttons for community join requests */}
                    {notification.type === 'community_join_request' && !notification.read && isFaculty && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Extract actor ID and community ID safely
                              let actorId;
                              if (typeof notification.actor === 'string') {
                                actorId = notification.actor;
                              } else if (notification.actor && notification.actor._id) {
                                actorId = typeof notification.actor._id === 'string'
                                  ? notification.actor._id
                                  : notification.actor._id.toString();
                              } else {
                                throw new Error('Invalid actor ID format');
                              }

                              let communityId;
                              if (typeof notification.community === 'string') {
                                communityId = notification.community;
                              } else if (notification.community && notification.community._id) {
                                communityId = typeof notification.community._id === 'string'
                                  ? notification.community._id
                                  : notification.community._id.toString();
                              } else {
                                throw new Error('Invalid community ID format');
                              }

                              await api.approveJoinRequest(communityId, actorId);
                              await markAsRead(notification._id);
                            } catch (error) {
                              console.error('Failed to approve join request:', error);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Extract actor ID and community ID safely
                              let actorId;
                              if (typeof notification.actor === 'string') {
                                actorId = notification.actor;
                              } else if (notification.actor && notification.actor._id) {
                                actorId = typeof notification.actor._id === 'string'
                                  ? notification.actor._id
                                  : notification.actor._id.toString();
                              } else {
                                throw new Error('Invalid actor ID format');
                              }

                              let communityId;
                              if (typeof notification.community === 'string') {
                                communityId = notification.community;
                              } else if (notification.community && notification.community._id) {
                                communityId = typeof notification.community._id === 'string'
                                  ? notification.community._id
                                  : notification.community._id.toString();
                              } else {
                                throw new Error('Invalid community ID format');
                              }

                              await api.rejectJoinRequest(communityId, actorId);
                              // Context will update automatically
                            } catch (error) {
                              console.error('Failed to reject join request:', error);
                            }
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bell size={64} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No notifications</p>
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? 'All caught up!' : 'You have no notifications yet'}
            </p>
          </div>
        )}
      </div>

      {/* Mark All as Read */}
      {notifications.some(n => !n.read) && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={async () => { await api.markAllNotificationsRead(); await loadNotifications(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition"
          >
            <Check size={16} />
            <span>Mark all as read</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;