import React, { useState, useEffect } from 'react';
import { Search, Users, User, Building } from 'lucide-react';
import api from '../../services/api';
import FollowButton from '../Profile/FollowButton';
import { useAuth } from '../../context/AuthContext';

const SearchView = ({ onUserClick }) => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], communities: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length > 0) {
      const debounce = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults({ users: [], communities: [] });
      setHasSearched(false);
    }
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.searchUsers(query.trim());
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const followingSet = new Set((currentUser?.following || []).map(String));
  const requestedSet = new Set((currentUser?.followRequested || []).map(String));

  const filteredUsers = results.users?.filter(u => u._id !== currentUser._id) || [];
  const filteredCommunities = results.communities || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Search</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for students, teachers, or communities..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <>
          {/* Users Section */}
          {filteredUsers.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-purple-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">
                  People ({filteredUsers.length})
                </h3>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => onUserClick && onUserClick(user._id)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {(user.username || user.name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{user.username || user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <FollowButton
                      userId={user._id}
                      initialFollowing={currentUser?.following?.includes(user._id)}
                      initialRequested={requestedSet.has(user._id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communities Section */}
          {filteredCommunities.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Building className="text-green-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">
                  Communities ({filteredCommunities.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCommunities.map((community) => (
                  <div
                    key={community._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition cursor-pointer"
                    onClick={() => onUserClick && onUserClick(community._id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{community.icon || '🏫'}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{community.name}</p>
                        <p className="text-sm text-gray-600">
                          {community.members || 0} members
                        </p>
                      </div>
                    </div>
                    {community.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {community.description}
                      </p>
                    )}
                    <FollowButton
                      userId={community._id}
                      initialFollowing={currentUser?.following?.includes(community._id)}
                      initialRequested={requestedSet.has(community._id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredUsers.length === 0 && filteredCommunities.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Search size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">No results found</p>
              <p className="text-sm text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          )}
        </>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Search size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">Start searching</p>
          <p className="text-sm text-gray-400">
            Find students, teachers, and communities on campus
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchView;