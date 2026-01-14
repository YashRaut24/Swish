import React from 'react';
import { X, Home, Compass, User, Shield, LogOut, MessageCircle, Bell, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VIEWS } from '../../utils/constants';

const MobileMenu = ({ isOpen, onClose, currentView, onViewChange }) => {
  const { user, logout, isAdmin } = useAuth();

  if (!isOpen) return null;

  const handleNavigation = (view) => {
    onViewChange(view);
    onClose();
  };

  const navItems = [
    { view: VIEWS.HOME, icon: Home, label: 'Home', color: 'text-blue-600' },
    { view: VIEWS.EXPLORE, icon: Compass, label: 'Explore', color: 'text-green-600' },
    { view: VIEWS.COMMUNITY, icon: Users, label: 'Communities', color: 'text-purple-600' },
    { view: VIEWS.CHAT, icon: MessageCircle, label: 'Messages', color: 'text-pink-600' },
    { view: VIEWS.NOTIFICATIONS, icon: Bell, label: 'Notifications', color: 'text-yellow-600' },
    { view: VIEWS.PROFILE, icon: User, label: 'Profile', color: 'text-indigo-600' },
  ];

  if (isAdmin) {
    navItems.push({ 
      view: VIEWS.ADMIN, 
      icon: Shield, 
      label: 'Admin Dashboard', 
      color: 'text-orange-600' 
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-white z-50 shadow-2xl md:hidden transform transition-transform duration-300 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Navigation
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => handleNavigation(item.view)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon size={22} className={isActive ? item.color : ''} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition mt-4 border-t border-gray-200 pt-4"
          >
            <LogOut size={22} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* App Info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Swish v1.0 - Campus Social Network
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;