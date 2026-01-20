import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, X } from 'lucide-react';
import api from '../../services/api';

const ExploreGrid = ({ onLike, onComment, onDelete, onShare, onUserClick }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

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

  const postsWithImages = posts.filter(post => post.imageUrl);

  const PostModal = ({ post, onClose }) => {
    if (!post) return null;

    return (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50"
          onClick={onClose}
        />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-2/3 bg-black flex items-center justify-center">
              <img
                src={post.imageUrl}
                alt="Post"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>

            {/* Details */}
            <div className="md:w-1/3 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{post.author?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {post.caption && (
                  <p className="text-gray-800 mb-4">{post.caption}</p>
                )}

                <div className="flex items-center space-x-4 py-3 border-t border-b">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold">
                      {post.likes?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold">
                      {post.comments?.length || 0}
                    </span>
                  </div>
                </div>

                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-sm">Comments</h4>
                    {post.comments.map((comment, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-semibold">{comment.author?.name}</span>{' '}
                        <span className="text-gray-700">{comment.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (postsWithImages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-2">No posts to explore yet</p>
        <p className="text-sm text-gray-400">Be the first to share something!</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Explore</h2>
        <p className="text-gray-600 text-sm">Discover posts from your campus community</p>
      </div>

      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {postsWithImages.map((post) => (
          <div
            key={post._id}
            className="aspect-square relative group cursor-pointer overflow-hidden"
            onClick={() => setSelectedPost(post)}
          >
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                <div className="flex items-center space-x-1">
                  <Heart className="w-5 h-5 fill-white" />
                  <span className="font-semibold">{post.likes?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span className="font-semibold">{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
};

export default ExploreGrid;