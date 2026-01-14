import React, { useState, useEffect } from 'react';
import { Home, Compass, User, Shield, LogOut, Menu, Bell, MessageCircle, Users, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VIEWS } from '../../utils/constants';
import api from '../../services/api';

const Header = ({ currentView, onViewChange, onMenuToggle }) => {
  const { user, logout, isAdmin } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadNotificationCounts();
    const interval = setInterval(loadNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificationCounts = async () => {
    try {
      const notifData = await api.getNotifications();
      const unread = notifData.notifications?.filter(n => !n.read).length || 0;
      setUnreadNotifications(unread);

      const chatData = await api.getChats();
      const unreadChats = chatData.chats?.filter(c => !c.read && c.recipientId === user._id).length || 0;
      setUnreadMessages(unreadChats);
    } catch (error) {
      console.error('Failed to load notification counts:', error);
    }
  };

  const navItems = [
    { view: VIEWS.HOME, icon: Home, label: 'Home' },
    { view: VIEWS.SEARCH, icon: Search, label: 'Search' },
    { view: VIEWS.EXPLORE, icon: Compass, label: 'Explore' },
    { view: VIEWS.COMMUNITY, icon: Users, label: 'Community' },
    { view: VIEWS.CHAT, icon: MessageCircle, label: 'Messages', badge: unreadMessages },
    { view: VIEWS.NOTIFICATIONS, icon: Bell, label: 'Notifications', badge: unreadNotifications },
    { view: VIEWS.PROFILE, icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ view: VIEWS.ADMIN, icon: Shield, label: 'Admin' });
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange(VIEWS.HOME)}>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-2xl font-bold text-purple-600">Swish</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    onViewChange(item.view);
                    if (item.view === VIEWS.NOTIFICATIONS) {
                      setUnreadNotifications(0);
                    } else if (item.view === VIEWS.CHAT) {
                      setUnreadMessages(0);
                    }
                  }}
                  className={`relative flex flex-col items-center px-4 py-2 rounded-lg transition ${
                    isActive 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                  title={item.label}
                >
                  <div className="relative">
                    <Icon size={22} />
                    {item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1">{item.label}</span>
                </button>
              );
            })}
            
            <button
              onClick={logout}
              className="flex flex-col items-center px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition ml-2"
              title="Logout"
            >
              <LogOut size={22} />
              <span className="text-xs font-medium mt-1">Logout</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition relative"
          >
            <Menu size={24} className="text-gray-700" />
            {(unreadNotifications > 0 || unreadMessages > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;