import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Check, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CommunityList = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const data = await api.getCommunities();
      setCommunities(data.communities || []);
      
      // Get user's followed communities
      const followed = data.communities
        ?.filter(c => c.followers?.includes(user._id))
        .map(c => c._id) || [];
      setFollowingIds(followed);
    } catch (error) {
      console.error('Failed to load communities:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowCommunity = async (communityId) => {
    try {
      const isFollowing = followingIds.includes(communityId);
      
      if (isFollowing) {
        await api.leaveCommunity(communityId);
        setFollowingIds(followingIds.filter(id => id !== communityId));
      } else {
        await api.joinCommunity(communityId);
        setFollowingIds([...followingIds, communityId]);
      }
      
      await loadCommunities();
    } catch (error) {
      console.error('Failed to join/leave community:', error);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      setError('Community name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.createCommunity({ name: newCommunityName });
      setNewCommunityName('');
      setShowCreateModal(false);
      await loadCommunities();
    } catch (err) {
      setError(err.message || 'Failed to create community');
    } finally {
      setCreating(false);
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Communities</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus size={20} />
              Create
            </button>
            <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          Join communities to connect with people who share your interests
        </p>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Create Community</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCommunityName('');
                  setError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="e.g., Computer Science, Basketball Club"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={120}
                />
              </div>

              <button
                onClick={handleCreateCommunity}
                disabled={creating}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {communities.map((community) => {
          const isFollowing = followingIds.includes(community._id);
          
          return (
            <div
              key={community._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {/* Community Header with Icon Background */}
              <div className="h-24 bg-gradient-to-br from-purple-500 to-blue-500 relative flex items-center justify-center">
                <span className="text-6xl">{community.icon || '🏫'}</span>
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

                {/* Follow Button */}
                <button
                  onClick={() => handleFollowCommunity(community._id)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition ${
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
                      Join Community
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* My Communities Section */}
      {followingIds.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            My Communities ({followingIds.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {communities
              .filter(c => followingIds.includes(c._id))
              .map((community) => (
                <div
                  key={`my-${community._id}`}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <span className="text-3xl mb-2">{community.icon || '🏫'}</span>
                  <span className="text-xs font-medium text-gray-700 text-center">
                    {community.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityList;