import React, { useState, useEffect } from 'react';
import { Users, Check, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../Post/PostCard';
import CreatePostModal from '../Post/CreatePostModal';
import api from '../../services/api';

const CommunityDashboardView = ({ onLike, onComment, onDelete, onShare, onUserClick, onUpdatePost, onSave }) => {
  const { user, isFaculty } = useAuth();
  const [posts, setPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [postsData, chatsData, communitiesData, statusData] = await Promise.all([
        api.getCommunityPosts(),
        api.getCommunityChats(),
        api.getCommunities(),
        api.getCommunityStatus()
      ]);
      setPosts(postsData.posts || []);
      setChats(chatsData.chats || []);

      let communitiesList = communitiesData.communities || [];
      // Sort to put College Announcements first
      communitiesList.sort((a, b) => {
        if (a.name === 'College Announcements') return -1;
        if (b.name === 'College Announcements') return 1;
        return 0;
      });
      setCommunities(communitiesList);

      // Set user's followed communities from DB
      setFollowingIds(statusData.followedCommunities || []);

      // Set user's pending join requests from DB
      const pendingCommunityIds = statusData.joinRequests
        ?.filter(jr => jr.status === 'pending')
        .map(jr => jr.communityId) || [];
      setPendingIds(pendingCommunityIds);
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.likePost(postId);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes?.includes(user._id);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter(id => id !== user._id)
              : [...(post.likes || []), user._id]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      const result = await api.commentOnPost(postId, text);
      setPosts(posts.map(post => post._id === postId ? result.post : post));
    } catch (error) {
      console.error('Failed to comment:', error);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.deletePost(postId);
        setPosts(posts.filter(post => post._id !== postId));
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleShare = async (postId) => {
    try {
      await api.sharePost(postId);
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, shares: (post.shares || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const handleFollowCommunity = async (communityId) => {
    if (followingIds.includes(communityId)) return;
    setFollowingIds([...followingIds, communityId]);
    try {
      await api.followCommunity(communityId);
    } catch (error) {
      console.error('Failed to follow community:', error);
      setFollowingIds(followingIds.filter(id => id !== communityId));
    }
  };

  const handleJoinCommunity = async (communityId) => {
    if (pendingIds.includes(communityId)) return;
    setPendingIds([...pendingIds, communityId]);
    try {
      await api.joinCommunity(communityId);
    } catch (error) {
      console.error('Failed to join community:', error);
      setPendingIds(pendingIds.filter(id => id !== communityId));
    }
  };

  const handleCreatePost = async ({ caption, media }) => {
    try {
      let mediaArray = [];

      if (media && media.length > 0) {
        try {
          console.log('Uploading', media.length, 'files...');
          const uploadResult = await api.uploadMedia(media);
          console.log('Upload successful:', uploadResult);
          mediaArray = uploadResult.media;
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          throw new Error(`Failed to upload files: ${uploadError.message}`);
        }
      }

      console.log('Creating post with media:', mediaArray);
      await api.createPost({ caption, media: mediaArray });
      await loadCommunityData();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Center: College Common Community posts and messages */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">College Common Community</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Community Posts</h2>
          {isFaculty && (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:bg-gray-50 transition"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-gray-500">What's on your mind?</span>
              </button>
            </div>
          )}
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDelete}
                onShare={handleShare}
                onUserClick={onUserClick}
              />
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-2">No community posts yet</p>
              <p className="text-sm text-gray-400 mb-4">Community posts will appear here.</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Community Messages</h2>
          {chats.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              {chats.slice(0, 10).map((chat, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>{chat.senderId === user._id ? 'You' : 'Community'}:</strong> {chat.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(chat.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-2">No community messages yet</p>
              <p className="text-sm text-gray-400 mb-4">Community messages will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Right side: Other communities */}
      <div className="w-80">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Communities</h2>
        <div className="space-y-4">
          {communities.filter(c => c.name !== 'College Announcements').map((community) => {
            const isFollowing = followingIds.includes(community._id);

            return (
              <div
                key={community._id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Community Header with Icon Background */}
                <div className="h-20 bg-gradient-to-br from-purple-500 to-blue-500 relative flex items-center justify-center">
                  <span className="text-4xl">{community.icon || '🏫'}</span>
                </div>

                {/* Community Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {community.name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{community.memberCount || community.members?.length || 0} members</span>
                    </div>
                    {isFollowing && (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Check size={14} />
                        Following
                      </span>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {/* Follow Button */}
                    <button
                      onClick={() => handleFollowCommunity(community._id)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        isFollowing
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check size={16} />
                          Following
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Plus size={16} />
                          Follow
                        </span>
                      )}
                    </button>

                    {/* Join Community Button */}
                    {user._id !== community.admin && (
                      <button
                        onClick={() => handleJoinCommunity(community._id)}
                        disabled={pendingIds.includes(community._id) || isFollowing}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                          pendingIds.includes(community._id)
                            ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                            : isFollowing
                            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {pendingIds.includes(community._id) ? (
                          <span className="flex items-center justify-center gap-2">
                            <Check size={16} />
                            Requested
                          </span>
                        ) : isFollowing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Check size={16} />
                            Joined
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Plus size={16} />
                            Join Community
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboardView;
