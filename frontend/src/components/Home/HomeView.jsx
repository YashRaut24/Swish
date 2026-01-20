import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../Post/PostCard';
import CreatePostModal from '../Post/CreatePostModal';
import api from '../../services/api';

const HomeView = ({ onLike, onComment, onDelete, onShare, onUserClick, onViewChange }) => {
  const { user, isViewOnly } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
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
      await loadPosts();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome back, {user?.name}!</h1>
        {!isViewOnly && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:bg-gray-50 transition"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-gray-500">What's on your mind?</span>
          </button>
        )}
      </div>

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
          <p className="text-gray-500 text-lg mb-2">No posts yet</p>
          <p className="text-sm text-gray-400 mb-4">Be the first to share something!</p>
          {!isViewOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Create Post
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
};

export default HomeView;
