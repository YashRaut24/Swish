import React, { useEffect, useState } from 'react';
import { UserPlus, Check, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// status can be 'none' | 'requested' | 'following'
const FollowButton = ({ userId, initialFollowing = false, initialRequested = false, onFollowChange }) => {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(initialFollowing ? 'following' : (initialRequested ? 'requested' : 'none'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(initialFollowing ? 'following' : (initialRequested ? 'requested' : 'none'));
  }, [initialFollowing, initialRequested, userId]);

  if (user?._id === userId) {
    return null; // Don't show follow button for own profile
  }

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (status === 'following') {
        await api.unfollowUser(userId);
        setStatus('none');
        updateUser?.({
          following: (user?.following || []).filter((id) => id?.toString() !== userId),
          followRequested: (user?.followRequested || []).filter((id) => id?.toString() !== userId),
        });
        onFollowChange && onFollowChange('none');
      } else if (status === 'requested') {
        // cancel request
        await api.unfollowUser(userId);
        setStatus('none');
        updateUser?.({
          followRequested: (user?.followRequested || []).filter((id) => id?.toString() !== userId),
        });
        onFollowChange && onFollowChange('none');
      } else {
        const res = await api.followUser(userId);
        const nextStatus = res.status || 'requested';
        setStatus(nextStatus);
        if (nextStatus === 'requested') {
          const nextRequested = new Set([...(user?.followRequested || []).map(String), userId]);
          updateUser?.({ followRequested: Array.from(nextRequested) });
        }
        onFollowChange && onFollowChange(nextStatus);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }

    if (status === 'following') {
      return <><Check size={16} /><span>Following</span></>;
    }

    if (status === 'requested') {
      return <><Clock size={16} /><span>Requested</span></>;
    }

    return <><UserPlus size={16} /><span>Follow</span></>;
  };

  const variantClasses = status === 'following'
    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
    : status === 'requested'
      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${variantClasses}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {renderContent()}
    </button>
  );
};

export default FollowButton;