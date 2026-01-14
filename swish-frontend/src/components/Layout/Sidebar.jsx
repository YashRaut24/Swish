import React from 'react';
import { Home, Compass, Users, MessageCircle, Bell, User, TrendingUp, Hash, Bookmark } from 'lucide-react';
import { VIEWS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ currentView, onViewChange }) => {
  const { user } = useAuth();

  const mainNavItems = [
    { view: VIEWS.HOME, icon: Home, label: 'Home', color: 'text-blue-600' },
    { view: VIEWS.EXPLORE, icon: Compass, label: 'Explore', color: 'text-green-600' },
    { view: VIEWS.COMMUNITY, icon: Users, label: 'Communities', color: 'text-purple-600' },
    { view: 'trending', icon: TrendingUp, label: 'Trending', color: 'text-orange-600' },
  ];

  const secondaryNavItems = [
    { view: VIEWS.CHAT, icon: MessageCircle, label: 'Messages', color: 'text-pink-600' },
    { view: VIEWS.NOTIFICATIONS, icon: Bell, label: 'Notifications', color: 'text-yellow-600' },
    { view: VIEWS.PROFILE, icon: User, label: 'Profile', color: 'text-indigo-600' },
  ];

  const quickLinks = [
    { icon: Hash, label: 'Campus Events', color: 'text-blue-500' },
    { icon: Bookmark, label: 'Saved Posts', color: 'text-green-500' },
  ];

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* User Profile Section */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Navigation
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className={isActive ? item.color : ''} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <nav className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Communication
          </p>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            
            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className={isActive ? item.color : ''} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Links */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Quick Links
          </p>
          {quickLinks.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <button
                key={index}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                <Icon size={18} className={item.color} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Trending Topics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Trending Topics
          </p>
          <div className="space-y-2">
            {['#CampusLife', '#StudyTips', '#Events', '#Sports'].map((tag) => (
              <button
                key={tag}
                className="block text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;