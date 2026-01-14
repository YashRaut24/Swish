import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Hash, Heart } from 'lucide-react';
import api from '../../services/api';
import PostCard from '../Post/PostCard';

const TrendingSection = ({ onLike, onComment, onDelete, onShare, onUserClick }) => {
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [mostLikedPosts, setMostLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hashtags'); // hashtags or posts

  useEffect(() => {
    loadTrendingData();
  }, []);

  const loadTrendingData = async () => {
    try {
      setLoading(true);
      
      // Load trending hashtags
      const hashtagData = await api.getTrendingHashtags();
      setTrendingHashtags(hashtagData.hashtags || []);
      
      // Load most liked posts
      const postsData = await api.getMostLikedPosts();
      setMostLikedPosts(postsData.posts || []);
    } catch (error) {
      console.error('Failed to load trending data:', error);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-md p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Flame size={32} />
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <p className="text-white/90 text-sm">
          Most popular content and topics on campus right now
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('hashtags')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            activeTab === 'hashtags'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Hash size={18} />
            <span>Trending Hashtags</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            activeTab === 'posts'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Heart size={18} />
            <span>Most Liked Posts</span>
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'hashtags' ? (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="text-purple-600" size={20} />
            <h3 className="text-lg font-bold text-gray-800">Trending Hashtags</h3>
          </div>
          
          {trendingHashtags.length > 0 ? (
            <div className="space-y-3">
              {trendingHashtags.map((topic, index) => (
                <div
                  key={topic.tag}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{topic.tag}</p>
                      <p className="text-sm text-gray-600">{topic.posts} posts</p>
                    </div>
                  </div>
                  <TrendingUp className="text-green-500" size={24} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Hash size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No trending hashtags yet</p>
              <p className="text-sm text-gray-400">Start using hashtags in your posts!</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="text-red-600" size={20} />
            <h3 className="text-lg font-bold text-gray-800">Most Liked Posts</h3>
          </div>

          {mostLikedPosts.length > 0 ? (
            <div className="space-y-4">
              {mostLikedPosts.map((post, index) => (
                <div key={post._id} className="relative">
                  {/* Ranking Badge */}
                  <div className="absolute -left-2 top-4 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-purple-600'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <PostCard
                    post={post}
                    onLike={onLike}
                    onComment={onComment}
                    onDelete={onDelete}
                    onShare={onShare}
                    onUserClick={onUserClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Heart size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">No posts yet</p>
              <p className="text-sm text-gray-400">Be the first to get likes!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendingSection;