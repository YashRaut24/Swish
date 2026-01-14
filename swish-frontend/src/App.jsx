import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VIEWS } from './utils/constants';
import api from './services/api';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MobileMenu from './components/Layout/MobileMenu';
import FloatingActionButton from './components/Layout/FloatingActionButton';
import PostCard from './components/Post/PostCard';
import CreatePostModal from './components/Post/CreatePostModal';
import ProfileView from './components/Profile/ProfileView';
import ExploreGrid from './components/Explore/ExploreGrid';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminReports from './components/Admin/AdminReports';
import ChatList from './components/Chat/ChatList';
import NotificationPanel from './components/Notifications/NotificationPanel';
import CommunityList from './components/Community/CommunityList';
import TrendingSection from './components/Trending/TrendingSection';
import SearchView from './components/Search/SearchView';
import SavedPostsView from './components/SavedPosts/SavedPostsView';

// Main App Content Component
const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState(VIEWS.HOME);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

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

  const handleUpdatePost = async (postId, caption) => {
    try {
      const result = await api.updatePost(postId, { caption });
      setPosts(posts.map(post => post._id === postId ? result.post : post));
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleUpdateComment = async (postId, commentId, text) => {
    try {
      const result = await api.updateComment(postId, commentId, text);
      setPosts(posts.map(post => post._id === postId ? result.post : post));
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const result = await api.deleteComment(postId, commentId);
      setPosts(posts.map(post => post._id === postId ? result.post : post));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.deletePost(postId);
        setPosts(posts.filter(post => post._id !== postId));
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleReport = async (postId) => {
    const reason = window.prompt('Please provide a reason for reporting this post:');
    if (reason) {
      try {
        await api.reportPost(postId, reason);
        alert('Post reported successfully. Admins will review it.');
      } catch (error) {
        console.error('Failed to report post:', error);
        alert('Failed to report post');
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

  const handleSave = async (postId, isSaved) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          savedBy: isSaved 
            ? [...(post.savedBy || []), user._id]
            : (post.savedBy || []).filter(id => id !== user._id)
        };
      }
      return post;
    }));
  };

  const handleUserClick = (userId) => {
    if (!userId) return;
    setSelectedUserId(userId);
    setChatUser(null);
    setView(VIEWS.PROFILE);
  };

  const handleStartChat = (userId, userName) => {
    setChatUser({ userId, userName });
    setView(VIEWS.CHAT);
  };

  const handlePostClick = (postId) => {
    // Navigate to home feed; optional: could scroll/highlight
    setView(VIEWS.HOME);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-4 mx-auto"></div>
          <p className="text-white text-xl font-semibold">Loading Swish...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (loading && view === VIEWS.HOME) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    switch (view) {
      case VIEWS.HOME:
        return (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:bg-gray-50 transition"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-gray-500">What's on your mind?</span>
              </button>
            </div>

            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onUpdatePost={handleUpdatePost}
                  onDelete={handleDeletePost}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onReport={handleReport}
                  onShare={handleShare}
                  onSave={handleSave}
                  onUserClick={handleUserClick}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg mb-2">No posts yet</p>
                <p className="text-sm text-gray-400 mb-4">Be the first to share something!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Create Post
                </button>
              </div>
            )}
          </div>
        );

      case VIEWS.EXPLORE:
        return <ExploreGrid posts={posts} />;

      case VIEWS.PROFILE:
        return <ProfileView userId={selectedUserId} onStartChat={handleStartChat} />;

      case VIEWS.CHAT:
        return <ChatList initialChat={chatUser} />;

      case VIEWS.NOTIFICATIONS:
        return <NotificationPanel onUserClick={handleUserClick} onPostClick={handlePostClick} />;

      case VIEWS.COMMUNITY:
        return <CommunityList />;

      case VIEWS.SEARCH:
        return <SearchView onUserClick={handleUserClick} />;

      case 'saved':
        return (
          <SavedPostsView
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDeletePost}
            onShare={handleShare}
            onUserClick={handleUserClick}
            onUnsave={handleSave}
          />
        );

      case 'trending':
        return (
          <TrendingSection
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDeletePost}
            onShare={handleShare}
            onUserClick={handleUserClick}
          />
        );

      case VIEWS.ADMIN:
        return user?.role === 'admin' ? (
          <div className="space-y-6">
            <AdminDashboard posts={posts} />
            <AdminReports />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-red-500 text-lg">Access Denied</p>
            <p className="text-gray-600 text-sm mt-2">You don't have permission to access this page</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={view}
        onViewChange={(newView) => {
          setView(newView);
          setSelectedUserId(null);
        }}
        onMenuToggle={() => setShowMobileMenu(true)}
      />

      <div className="flex">
        <Sidebar currentView={view} onViewChange={setView} />

        <main className="flex-1 max-w-4xl mx-auto px-4 py-6">
          {renderContent()}
        </main>

        <aside className="hidden xl:block w-80 p-4">
          <div className="sticky top-20">
            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setView('saved')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                >
                  📑 Saved Posts
                </button>
                <button
                  onClick={() => setView('trending')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                >
                  🔥 Trending
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentView={view}
        onViewChange={setView}
      />

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

      <FloatingActionButton onClick={() => setShowCreateModal(true)} />
    </div>
  );
};

// Auth Wrapper Component
const AuthWrapper = () => {
  const [authView, setAuthView] = useState('login');
  const { user } = useAuth();

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitch={() => setAuthView('register')} />
    ) : (
      <Register onSwitch={() => setAuthView('login')} />
    );
  }

  return <AppContent />;
};

// Root App Component
const App = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

export default App;