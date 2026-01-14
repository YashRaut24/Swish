import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Edit2, Users, ArrowLeft, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import EditProfileModal from './EditProfileModal';
import FollowButton from './FollowButton';

const ProfileView = ({ userId = null, onStartChat }) => {
  const { user: currentUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser?._id;

      // Fetch target user
      const userRes = await api.getUserById(targetUserId);
      const targetUser = userRes.user || currentUser;
      setUser(targetUser);

      // Fetch posts by author filter
      const data = await api.getPosts(`author=${targetUserId}`);
      const posts = data.posts || [];
      setUserPosts(posts);

      setStats({
        posts: posts.length,
        followers: targetUser?.followers?.length || 0,
        following: targetUser?.following?.length || 0,
      });

      if (targetUserId === currentUser?._id) {
        const requests = await Promise.all((targetUser?.followRequests || []).map(async (id) => {
          try {
            const res = await api.getUserById(id);
            return res.user;
          } catch (err) {
            console.warn('Failed to load requester', err);
            return null;
          }
        }));
        setPendingRequests(requests.filter(Boolean));
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      const userId = typeof requesterId === 'string' ? requesterId : requesterId._id;
      await api.acceptFollowRequest(userId);
      // Remove from pending requests list
      setPendingRequests((prev) => prev.filter((req) => req._id !== userId));
      // Reload to get fresh data
      await loadUserData();
    } catch (error) {
      console.error('Accept follow failed:', error);
      // Reload anyway to clear stale data
      await loadUserData();
    }
  };

  const handleRejectRequest = async (requesterId) => {
    try {
      const userId = typeof requesterId === 'string' ? requesterId : requesterId._id;
      await api.rejectFollowRequest(userId);
      // Remove from pending requests list
      setPendingRequests((prev) => prev.filter((req) => req._id !== userId));
      // Reload to get fresh data
      await loadUserData();
    } catch (error) {
      console.error('Reject follow failed:', error);
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const followingSet = new Set((currentUser?.following || []).map(String));
  const isFollowingUser = !isOwnProfile && followingSet.has(user?._id);
  const isRequestedByMe = !isOwnProfile && (
    (user?.followRequests || []).map(String).includes(currentUser?._id) ||
    (currentUser?.followRequested || []).map(String).includes(user?._id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isOwnProfile && (
        <button
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-5xl font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">
                {user?.name}
              </h2>
              <div className="flex gap-2 justify-center md:justify-start">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-gray-700"
                  >
                    <Edit2 size={16} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (onStartChat) {
                          onStartChat(user?._id, user?.username || user?.name);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                    >
                      <MessageCircle size={16} />
                      <span>Message</span>
                    </button>
                    <FollowButton
                      userId={user?._id}
                      initialFollowing={isFollowingUser}
                      initialRequested={isRequestedByMe}
                      onFollowChange={loadUserData}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                <Mail size={16} />
                <span className="text-sm">{user?.email}</span>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                <Calendar size={16} />
                <span className="text-sm">Joined {formatDate(user?.createdAt)}</span>
              </div>
            </div>

            <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </div>

            {user?.bio && (
              <p className="text-gray-700 leading-relaxed max-w-2xl">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats with follower management */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.posts}</p>
            <p className="text-sm text-gray-600">Posts</p>
          </div>
          <div className="text-center">
            {isOwnProfile ? (
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.followers}</p>
                <p className="text-sm text-gray-600">Followers</p>
              </div>
            ) : (
              <button
                onClick={() => {/* Could show followers list here */}}
                className="w-full text-center hover:bg-gray-50 rounded-lg py-2 transition"
              >
                <p className="text-2xl font-bold text-blue-600">{stats.followers}</p>
                <p className="text-sm text-gray-600">Followers</p>
              </button>
            )}
          </div>
          <div className="text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2 transition">
            <p className="text-2xl font-bold text-green-600">{stats.following}</p>
            <p className="text-sm text-gray-600">Following</p>
          </div>
        </div>
      </div>

      {/* Remove Follower Section (only visible on own profile) */}
      {isOwnProfile && stats.followers > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Followers</h3>
            <span className="text-sm text-gray-500">{stats.followers}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Remove followers you no longer want to see your posts</p>
          {/* Note: Implement a separate follower list view if needed */}
          <div className="text-sm text-gray-500">
            {stats.followers} people follow you
          </div>
        </div>
      )}

      {/* Pending Follow Requests */}
      {isOwnProfile && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              <h3 className="text-lg font-bold text-gray-800">Follow Requests</h3>
            </div>
            <span className="text-sm text-gray-500">{pendingRequests.length}</span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {req.username?.[0]?.toUpperCase() || req.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{req.username || req.name}</p>
                    <p className="text-xs text-gray-500">{req.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                    onClick={() => handleRejectRequest(req._id)}
                  >
                    Reject
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleAcceptRequest(req._id)}
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Posts Grid */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {isOwnProfile ? 'My Posts' : `${user?.name}'s Posts`}
          </h3>
          <span className="text-sm text-gray-500">{stats.posts} posts</span>
        </div>
        
        {userPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {userPosts.map((post) => (
              <div
                key={post._id}
                className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover hover:opacity-75 transition"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center p-2">
                    <p className="text-xs text-gray-600 text-center line-clamp-4">
                      {post.caption}
                    </p>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-4 text-white text-sm font-semibold">
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              {isOwnProfile ? 'No posts yet' : `${user?.name} hasn't posted yet`}
            </p>
            {isOwnProfile && (
              <p className="text-sm text-gray-400">Share your first post to get started!</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfileView;