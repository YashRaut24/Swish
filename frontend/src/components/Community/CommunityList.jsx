import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, TrendingUp, Check, Plus, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CommunityList = () => {
  const { user, isFaculty } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [presidentQuery, setPresidentQuery] = useState('');
  const [showPresidentDropdown, setShowPresidentDropdown] = useState(false);
  const [presidentSuggestions, setPresidentSuggestions] = useState([]);
  const [selectedPresident, setSelectedPresident] = useState(null);
  const [generalSecretaryQuery, setGeneralSecretaryQuery] = useState('');
  const [showGeneralSecretaryDropdown, setShowGeneralSecretaryDropdown] = useState(false);
  const [generalSecretarySuggestions, setGeneralSecretarySuggestions] = useState([]);
  const [selectedGeneralSecretary, setSelectedGeneralSecretary] = useState(null);
  const presidentInputRef = useRef(null);
  const generalSecretaryInputRef = useRef(null);
  const presidentDropdownRef = useRef(null);
  const generalSecretaryDropdownRef = useRef(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const [communitiesData, statusData] = await Promise.all([
        api.getCommunities(),
        api.getCommunityStatus()
      ]);

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

      // Set user's joined communities from DB
      setJoinedIds(statusData.joinedCommunities || []);

      // Set user's pending join requests from DB
      const pendingCommunityIds = statusData.joinRequests
        ?.filter(jr => jr.status === 'pending')
        .map(jr => jr.communityId) || [];
      setPendingIds(pendingCommunityIds);
    } catch (error) {
      console.error('Failed to load communities:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowCommunity = async (communityId) => {
    const isCurrentlyFollowing = followingIds.includes(communityId);
    const newFollowingIds = isCurrentlyFollowing
      ? followingIds.filter(id => id !== communityId)
      : [...followingIds, communityId];

    setFollowingIds(newFollowingIds);
    try {
      await api.followCommunity(communityId);
    } catch (error) {
      console.error('Failed to follow/unfollow community:', error);
      setFollowingIds(followingIds); // Revert on error
    }
  };

  const handleJoinCommunity = async (communityId) => {
    if (pendingIds.includes(communityId)) return;
    const newPendingIds = [...pendingIds, communityId];
    setPendingIds(newPendingIds);
    localStorage.setItem('communityPendingIds', JSON.stringify(newPendingIds));
    try {
      await api.joinCommunity(communityId);
    } catch (error) {
      console.error('Failed to join community:', error);
      const revertedIds = pendingIds.filter(id => id !== communityId);
      setPendingIds(revertedIds);
      localStorage.setItem('communityPendingIds', JSON.stringify(revertedIds));
    }
  };

  const handlePresidentInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setPresidentQuery(query);
    if (query.trim().length > 0) {
      try {
        const data = await api.searchUsers(query.trim());
        setPresidentSuggestions(data.users || []);
        setShowPresidentDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setPresidentSuggestions([]);
      }
    } else {
      setPresidentSuggestions([]);
      setShowPresidentDropdown(false);
    }
  }, []);

  const handlePresidentInputFocus = () => {
    if (presidentSuggestions.length > 0) {
      setShowPresidentDropdown(true);
    }
  };

  const handlePresidentSelect = (user) => {
    setSelectedPresident(user);
    setPresidentQuery('');
    setShowPresidentDropdown(false);
  };

  const handleGeneralSecretaryInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setGeneralSecretaryQuery(query);
    if (query.trim().length > 0) {
      try {
        const data = await api.searchUsers(query.trim());
        setGeneralSecretarySuggestions(data.users || []);
        setShowGeneralSecretaryDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setGeneralSecretarySuggestions([]);
      }
    } else {
      setGeneralSecretarySuggestions([]);
      setShowGeneralSecretaryDropdown(false);
    }
  }, []);

  const handleGeneralSecretaryInputFocus = () => {
    if (generalSecretarySuggestions.length > 0) {
      setShowGeneralSecretaryDropdown(true);
    }
  };

  const handleGeneralSecretarySelect = (user) => {
    setSelectedGeneralSecretary(user);
    setGeneralSecretaryQuery('');
    setShowGeneralSecretaryDropdown(false);
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      setError('Community name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.createCommunity({
        name: newCommunityName,
        isOfficial: isFaculty && isOfficial,
        president: selectedPresident?._id,
        generalSecretary: selectedGeneralSecretary?._id
      });
      setNewCommunityName('');
      setIsOfficial(false);
      setPresidentQuery('');
      setSelectedPresident(null);
      setGeneralSecretaryQuery('');
      setSelectedGeneralSecretary(null);
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
            {isFaculty && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus size={20} />
                Create
              </button>
            )}
            <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          {isFaculty ? 'Create and manage communities for your classes' : 'Join communities to connect with people who share your interests'}
        </p>
      </div>

      {/* Create Community Modal - Faculty Only */}
      {showCreateModal && isFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Create Community</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCommunityName('');
                  setIsOfficial(false);
                  setError('');
                  setPresidentQuery('');
                  setSelectedPresident(null);
                  setGeneralSecretaryQuery('');
                  setSelectedGeneralSecretary(null);
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

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">President</label>
                <input
                  ref={presidentInputRef}
                  type="text"
                  value={presidentQuery}
                  onChange={handlePresidentInputChange}
                  onFocus={handlePresidentInputFocus}
                  placeholder="Search for a student or faculty member"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {showPresidentDropdown && presidentSuggestions.length > 0 && (
                  <div ref={presidentDropdownRef} className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {presidentSuggestions.map((suggestion) => (
                      <div
                        key={suggestion._id}
                        onClick={() => handlePresidentSelect(suggestion)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      >
                        <img
                          src={suggestion.profilePic || '/default-avatar.png'}
                          alt={suggestion.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{suggestion.username}</div>
                          <div className="text-sm text-gray-500">{suggestion.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPresident && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedPresident.profilePic || '/default-avatar.png'}
                      alt={selectedPresident.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{selectedPresident.username}</div>
                      <div className="text-sm text-gray-500">{selectedPresident.role}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">General Secretary</label>
                <input
                  ref={generalSecretaryInputRef}
                  type="text"
                  value={generalSecretaryQuery}
                  onChange={handleGeneralSecretaryInputChange}
                  onFocus={handleGeneralSecretaryInputFocus}
                  placeholder="Search for a student or faculty member"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {showGeneralSecretaryDropdown && generalSecretarySuggestions.length > 0 && (
                  <div ref={generalSecretaryDropdownRef} className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {generalSecretarySuggestions.map((suggestion) => (
                      <div
                        key={suggestion._id}
                        onClick={() => handleGeneralSecretarySelect(suggestion)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      >
                        <img
                          src={suggestion.profilePic || '/default-avatar.png'}
                          alt={suggestion.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{suggestion.username}</div>
                          <div className="text-sm text-gray-500">{suggestion.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedGeneralSecretary && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedGeneralSecretary.profilePic || '/default-avatar.png'}
                      alt={selectedGeneralSecretary.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{selectedGeneralSecretary.username}</div>
                      <div className="text-sm text-gray-500">{selectedGeneralSecretary.role}</div>
                    </div>
                  </div>
                </div>
              )}

              {isFaculty && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="official"
                      checked={isOfficial}
                      onChange={(e) => setIsOfficial(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="official" className="text-sm font-medium text-blue-900 flex items-center gap-2">
                      <Shield size={16} />
                      Official Class / Department Community
                    </label>
                  </div>
                  <p className="text-xs text-blue-700 mt-2 ml-6">
                    Auto-approved and marked as official. Students can join and participate.
                  </p>
                </div>
              )}

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
          const isCreator = user._id === community.admin;
          const isJoined = joinedIds.includes(community._id) || isCreator;
          const isPending = pendingIds.includes(community._id);
          const isFollowing = followingIds.includes(community._id);
          const isAnnouncement = community.name === 'College Announcements';

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
                  {isFollowing && !isAnnouncement && (
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
                    disabled={isAnnouncement}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      isAnnouncement ? 'bg-gray-100 text-gray-700 cursor-not-allowed' :
                      isFollowing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' :
                      'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isFollowing ? (
                        <>
                          <Check size={16} />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Follow
                        </>
                      )}
                    </span>
                  </button>

                  {/* Join Community Button */}
                  {user._id !== community.admin && (
                    <button
                      onClick={() => handleJoinCommunity(community._id)}
                      disabled={isJoined || isPending}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        isJoined ? 'bg-green-100 text-green-700 cursor-not-allowed' :
                        isPending ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed' :
                        'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isJoined ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check size={16} />
                          Joined
                        </span>
                      ) : isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check size={16} />
                          Requested
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