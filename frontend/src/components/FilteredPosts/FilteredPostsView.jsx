import React, { useState, useEffect } from 'react';
import PostCard from '../Post/PostCard';
import api from '../../services/api';
import { useFiltered } from '../../context/FilteredContext';

const FilteredPostsView = ({ onLike, onComment, onDelete, onShare, onUserClick }) => {
  const { currentTag } = useFiltered();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTag) {
      loadPosts();
    }
  }, [currentTag]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts(`tag=${encodeURIComponent(currentTag)}`);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load filtered posts:', error);
    } finally {
      setLoading(false);
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
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-md p-6 text-white">
        <h2 className="text-2xl font-bold">Posts with #{currentTag}</h2>
        <p className="text-white/90 text-sm">
          Posts containing the tag #{currentTag}
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={onLike}
              onComment={onComment}
              onDelete={onDelete}
              onShare={onShare}
              onUserClick={onUserClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">No posts found</p>
          <p className="text-sm text-gray-400">No posts contain the tag #{currentTag}</p>
        </div>
      )}
    </div>
  );
};

export default FilteredPostsView;
