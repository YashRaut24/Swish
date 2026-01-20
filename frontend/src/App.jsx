import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { VIEWS } from './utils/constants';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MobileMenu from './components/Layout/MobileMenu';
import AdminLayout from './components/Layout/AdminLayout';
import HomeView from './components/Home/HomeView';
import ExploreGrid from './components/Explore/ExploreGrid';
import ProfileView from './components/Profile/ProfileView';
import ChatList from './components/Chat/ChatList';
import CommunityList from './components/Community/CommunityList';
import NotificationPanel from './components/Notifications/NotificationPanel';
import AdminDashboard from './components/Admin/AdminDashboard';
import SearchView from './components/Search/SearchView';
import SavedPostsView from './components/SavedPosts/SavedPostsView';
import TrendingSection from './components/Trending/TrendingSection';
import EventsView from './components/Events/EventsView';
import FilteredPostsView from './components/FilteredPosts/FilteredPostsView';
import CommunityDashboardView from './components/Community/CommunityDashboardView';
import { FilteredProvider } from './context/FilteredContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

const App = () => {
  const { user, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState((user?.role === 'Admin' || user?.email === 'admin@campus.edu') ? VIEWS.ADMIN_DASHBOARD : VIEWS.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [profileUserId, setProfileUserId] = useState(null);
  const [initialChat, setInitialChat] = useState(null);

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === VIEWS.PROFILE) {
      setProfileUserId(null); // Reset to show own profile
    }
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLike = (postId) => {
    // Handle like logic
  };

  const handleComment = (postId, text) => {
    // Handle comment logic
  };

  const handleDelete = (postId) => {
    // Handle delete logic
  };

  const handleShare = (postId) => {
    // Handle share logic
  };

  const handleUpdatePost = async (postId, caption) => {
    try {
      await api.updatePost(postId, { caption });
      // Refresh current view if needed
      if (currentView === VIEWS.HOME) {
        // HomeView will handle its own refresh
      }
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  };

  const handleSave = async (postId, isSaved) => {
    try {
      if (isSaved) {
        await api.savePost(postId);
      } else {
        await api.unsavePost(postId);
      }
    } catch (error) {
      console.error('Failed to save/unsave post:', error);
    }
  };

  const handleUserClick = (userId) => {
    setProfileUserId(userId);
    setCurrentView(VIEWS.PROFILE);
  };

  const handleStartChat = (userId, userName) => {
    setInitialChat({ userId, userName });
    setCurrentView(VIEWS.CHAT);
  };

  const renderView = () => {
    switch (currentView) {
      case VIEWS.HOME:
        return <HomeView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onViewChange={handleViewChange} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.EXPLORE:
        return <ExploreGrid onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.PROFILE:
        return <ProfileView userId={profileUserId} onStartChat={handleStartChat} onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.CHAT:
        return <ChatList initialChat={initialChat} onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.COMMUNITY:
        return <CommunityList onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.COMMUNITY_DASHBOARD:
        return <CommunityDashboardView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.NOTIFICATIONS:
        return <NotificationPanel onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.ADMIN:
        return <AdminDashboard onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.SEARCH:
        return <SearchView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.SAVED:
        return <SavedPostsView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} onUnsave={handleSave} />;
      case VIEWS.TRENDING:
        return <TrendingSection onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onViewChange={handleViewChange} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.EVENTS:
        return <EventsView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      case VIEWS.FILTERED:
        return <FilteredPostsView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
      default:
        return <HomeView onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={handleShare} onUserClick={handleUserClick} onUpdatePost={handleUpdatePost} onSave={handleSave} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return isLogin ? <Login onSwitch={() => setIsLogin(false)} onLoginSuccess={(isCommunity) => { if (isCommunity) setCurrentView(VIEWS.COMMUNITY_DASHBOARD); }} /> : <Register onSwitch={() => setIsLogin(true)} />;
  }

  if (user.role === 'Admin' || user.email === 'admin@campus.edu') {
    return <AdminLayout currentView={currentView} onViewChange={handleViewChange} onLogout={logout} />;
  }

  return (
      <FilteredProvider>
        <div className="min-h-screen bg-gray-50">
          <Header currentView={currentView} onViewChange={handleViewChange} onMenuToggle={handleMenuToggle} />
          <div className="flex">
            <Sidebar currentView={currentView} onViewChange={handleViewChange} />
            <main className="flex-1 p-6">
              {renderView()}
            </main>
          </div>
          <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} currentView={currentView} onViewChange={handleViewChange} />
        </div>
      </FilteredProvider>
  );
};

export default App;
