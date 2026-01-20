import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import api from '../../services/api';
import PostCard from '../Post/PostCard';

const SavedPostsView = ({ onLike, onComment, onDelete, onShare, onUserClick, onUnsave }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getSavedPosts();
      setSavedPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId) => {
    try {
      await api.unsavePost(postId);
      setSavedPosts(savedPosts.filter(post => post._id !== postId));
      onUnsave && onUnsave(postId);
    } catch (error) {
      console.error('Failed to unsave post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3">
          <Bookmark className="text-purple-600" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Saved Posts</h2>
            <p className="text-sm text-gray-600">{savedPosts.length} saved posts</p>
          </div>
        </div>
      </div>

      {/* Saved Posts */}
      {savedPosts.length > 0 ? (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <div key={post._id} className="relative">
              <PostCard
                post={post}
                onLike={onLike}
                onComment={onComment}
                onDelete={onDelete}
                onShare={onShare}
                onUserClick={onUserClick}
                showSaveButton={false}
              />
              <button
                onClick={() => handleUnsave(post._id)}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                title="Remove from saved"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Bookmark size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No saved posts</p>
          <p className="text-sm text-gray-400">
            Posts you save will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default SavedPostsView;