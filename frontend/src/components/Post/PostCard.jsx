import React, { useState } from 'react';
import { Heart, MessageCircle, Send, MoreVertical, Trash2, Flag, Share2, X, Bookmark, Edit2, Eye, EyeOff, Volume2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import FollowButton from '../Profile/FollowButton';

const QUICK_COMMENTS = ['Nice! 👍', 'Excellent! 🎉', 'Superb! 🔥', 'Awesome! 😍', 'Love this! ❤️', 'Great work! 💪'];

const PostCard = ({ post, onLike, onComment, onUpdatePost, onDelete, onUpdateComment, onDeleteComment, onReport, onShare, onUserClick, onSave, showSaveButton = true }) => {
  const { user, isFaculty } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState([]);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(post.savedBy?.includes(user?._id) || false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption || '');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [showQuickComments, setShowQuickComments] = useState(false);
  
  const isAuthor = user?._id === post.author?._id;
  const canDelete = isAuthor || user?.role === 'admin';
  const isFollowingAuthor = (user?.following || []).map(String).includes(post.author?._id);
  const hasRequestedAuthor = (user?.followRequested || []).map(String).includes(post.author?._id);

  React.useEffect(() => {
    if (showShareModal) {
      loadUsers();
    }
  }, [showShareModal]);

  const loadUsers = async () => {
    try {
      const data = await api.searchUsers('');
      setShareUsers(data.users?.filter(u => u._id !== user._id) || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    
    try {
      await onLike(post._id);
    } catch (error) {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
    }
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    try {
      if (isSaved) {
        await api.unsavePost(post._id);
      } else {
        await api.savePost(post._id);
      }
      onSave && onSave(post._id, !isSaved);
    } catch (error) {
      setIsSaved(!isSaved);
      console.error('Failed to save post:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    
    try {
      await onComment(post._id, comment);
      setComment('');
      setShowQuickComments(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleUpdateCaption = async () => {
    if (editedCaption.trim() !== post.caption) {
      await onUpdatePost(post._id, editedCaption);
    }
    setEditingCaption(false);
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id || comment.id);
    setEditedCommentText(comment.text);
  };

  const handleUpdateCommentSubmit = async () => {
    if (!editingCommentId || !editedCommentText.trim()) return;
    
    try {
      await onUpdateComment(post._id, editingCommentId, editedCommentText);
      setEditingCommentId(null);
      setEditedCommentText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDeleteCommentClick = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await onDeleteComment(post._id, commentId);
        setEditingCommentId(null);
        setEditedCommentText('');
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment');
      }
    }
  };

  const handleQuickComment = async (text) => {
    try {
      await onComment(post._id, text);
      setComment('');
      setShowQuickComments(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post on Swish',
          text: post.caption || 'Interesting post!',
          url: window.location.href,
        });
      } else {
        setShowShareModal(true);
      }
      onShare && onShare(post._id);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setShowShareModal(true);
      }
    }
  };

  const handleShareToUser = async (recipientId) => {
    try {
      await api.sharePostToUser(post._id, recipientId);
      alert('Post shared successfully!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share post');
    }
  };

  const handleVote = async (optionIndex) => {
    if (hasVoted) return;
    try {
      await api.votePoll(post._id, optionIndex);
      setPollVotes([...pollVotes, { user: user._id, option: optionIndex }]);
      setHasVoted(true);
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to vote');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  const formatDate = (date) => {
    const postDate = new Date(date);
    const now = new Date();
    const diff = now - postDate;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return postDate.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition"
            onClick={() => onUserClick && onUserClick(post.author?._id)}
          >
            <img 
              src={post.author?.profilePic || `https://ui-avatars.com/api/?name=${post.author?.username || 'User'}&background=random`}
              alt={post.author?.username}
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-purple-500 transition"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${post.author?.username || 'User'}&background=random`;
              }}
            />
            <div>
              <p className="font-semibold text-gray-800 hover:text-purple-600 transition flex items-center gap-2">
                {post.author?.username || 'Unknown User'}
                {post.isFacultyPost && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">✓ Official</span>}
                {post.isBroadcast && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">📢 Broadcast</span>}
              </p>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          {!isAuthor && (
            <FollowButton
              userId={post.author?._id}
              initialFollowing={isFollowingAuthor}
                initialRequested={hasRequestedAuthor}
              onFollowChange={(following) => {
                // optional: optimistic UI; currently handled inside component state
              }}
            />
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <MoreVertical size={20} className="text-gray-600" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                {canDelete && (
                  <>
                    <button
                      onClick={() => {
                        setEditingCaption(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-blue-600"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete(post._id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
                {!isAuthor && onReport && (
                  <button
                    onClick={() => {
                      onReport(post._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-orange-600"
                  >
                    <Flag size={16} />
                    <span>Report</span>
                  </button>
                )}
                {isFaculty && !isAuthor && (
                  <>
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={() => {
                        // Hide post logic
                        onReport(post._id, 'hide');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                      title="Hide this post from community"
                    >
                      <EyeOff size={16} />
                      <span>Hide Post</span>
                    </button>
                    <button
                      onClick={() => {
                        // Mute user logic
                        alert(`Muting student: ${post.author?.username}`);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                      title="Mute this student"
                    >
                      <Volume2 size={16} />
                      <span>Mute Student</span>
                    </button>
                    <button
                      onClick={() => {
                        onReport(post._id, 'priority');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                      title="Priority report with faculty flag"
                    >
                      <Flag size={16} />
                      <span>Priority Report</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className={`grid ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
          {post.media.map((item, index) => (
            <div key={index} className="relative">
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  controls
                  className="w-full h-96 object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-96 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legacy single image support */}
      {post.imageUrl && (!post.media || post.media.length === 0) && (
        <img src={post.imageUrl} alt="Post" className="w-full h-96 object-cover" />
      )}

      {/* Content */}
      <div className="p-4">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:scale-110 transition group"
            >
              <Heart
                size={24}
                className={`transition ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
              <span className="text-sm font-semibold text-gray-700">{likeCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:scale-110 transition"
            >
              <MessageCircle size={24} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                {post.comments?.length || 0}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:scale-110 transition"
            >
              <Share2 size={24} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                {post.shares || 0}
              </span>
            </button>
          </div>

          {/* Save Button */}
          {showSaveButton && (
            <button
              onClick={handleSave}
              className="hover:scale-110 transition"
              title={isSaved ? 'Remove from saved' : 'Save post'}
            >
              <Bookmark
                size={24}
                className={`transition ${isSaved ? 'fill-purple-600 text-purple-600' : 'text-gray-600'}`}
              />
            </button>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            {editingCaption ? (
              <div className="space-y-2">
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Edit caption..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditingCaption(false);
                      setEditedCaption(post.caption);
                    }}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCaption}
                    disabled={!editedCaption.trim()}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800">
                <span
                  className="font-semibold mr-2 cursor-pointer hover:text-purple-600"
                  onClick={() => onUserClick && onUserClick(post.author?._id)}
                >
                  {post.author?.username || 'Unknown User'}
                </span>
                {post.caption}
              </p>
            )}
          </div>
        )}

        {/* Poll */}
        {post.pollOptions && post.pollOptions.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Poll</h4>
            <div className="space-y-2">
              {post.pollOptions.map((option, index) => {
                const voteCount = pollVotes.filter(v => v.option === index).length;
                const totalVotes = pollVotes.length;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const isSelected = pollVotes.some(v => v.user === user?._id && v.option === index);

                return (
                  <button
                    key={index}
                    onClick={() => handleVote(index)}
                    disabled={hasVoted}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : hasVoted
                        ? 'bg-gray-100 border-gray-200 text-gray-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{option}</span>
                      {hasVoted && <span className="text-sm">{Math.round(percentage)}%</span>}
                    </div>
                    {hasVoted && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {hasVoted && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Faculty Badges */}
        {(post.isFacultyPost || post.isImportant || post.isExamRelated || post.isVerified) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.isFacultyPost && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                Faculty Post
              </span>
            )}
            {post.isImportant && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                Important
              </span>
            )}
            {post.isExamRelated && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                Exam Related
              </span>
            )}
            {post.isVerified && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                Verified
              </span>
            )}
          </div>
        )}

        {/* View Comments Button */}
        {post.comments?.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            View all {post.comments.length} comments
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {post.comments?.length > 0 ? (
                post.comments.map((c) => (
                  <div key={c._id || c.id} className="text-sm flex items-start justify-between group">
                    <div className="flex-1">
                      {editingCommentId === (c._id || c.id) ? (
                        <div className="space-y-2">
                          <textarea
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            rows={2}
                            placeholder="Edit comment..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditedCommentText('');
                              }}
                              className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateCommentSubmit}
                              disabled={!editedCommentText.trim()}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <img
                            src={c.user?.profilePic || `https://ui-avatars.com/api/?name=${c.user?.username || 'User'}&background=random`}
                            alt={c.user?.username}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${c.user?.username || 'User'}&background=random`;
                            }}
                          />
                          <div className="flex-1">
                            <span
                              className="font-semibold mr-2 cursor-pointer hover:text-purple-600"
                              onClick={() => onUserClick && onUserClick(c.user?._id)}
                            >
                              {c.user?.username || 'Unknown User'}
                            </span>
                            <span className="text-gray-700">{c.text}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {user && c.user?._id === user._id && editingCommentId !== (c._id || c.id) && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditComment(c)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit comment"
                        >
                          <Edit2 size={14} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCommentClick(c._id || c.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Delete comment"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>

            {/* Quick Comment Suggestions */}
            {showQuickComments && (
              <div className="flex flex-wrap gap-2 mb-2">
                {QUICK_COMMENTS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleQuickComment(suggestion);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Comment Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setShowQuickComments(true)}
                onBlur={() => setTimeout(() => setShowQuickComments(false), 300)}
                onKeyPress={handleKeyPress}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={200}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Share to</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {shareUsers.map((shareUser) => (
                <button
                  key={shareUser._id}
                  onClick={() => handleShareToUser(shareUser._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {shareUser.name[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{shareUser.name}</p>
                    <p className="text-xs text-gray-500">{shareUser.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;