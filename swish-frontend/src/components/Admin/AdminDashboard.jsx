import React, { useState, useEffect } from 'react';
import { Users, FileText, Heart, MessageCircle, TrendingUp, Activity } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = ({ posts }) => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalUsers: 0,
  });

  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    calculateStats();
  }, [posts]);

  const calculateStats = () => {
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
    
    // Get unique authors
    const uniqueAuthors = new Set(posts.map(post => post.author?._id).filter(Boolean));
    
    setStats({
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      totalUsers: uniqueAuthors.size,
    });

    // Get recent posts (last 5)
    const sorted = [...posts].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setRecentPosts(sorted.slice(0, 5));
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm border border-gray-100`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className={`px-3 py-1 ${color} bg-opacity-10 rounded-full`}>
          <span className={`text-xs font-semibold ${color}`}>Active</span>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-gray-600">Monitor and manage your campus community</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={stats.totalPosts}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={Heart}
          label="Total Likes"
          value={stats.totalLikes}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          icon={MessageCircle}
          label="Total Comments"
          value={stats.totalComments}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.totalUsers}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Recent Posts</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Latest Activity</span>
          </div>
        </div>

        {recentPosts.length > 0 ? (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post._id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {post.author?.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {post.caption || 'No caption'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-red-600">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        )}
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Engagement Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Likes per Post</span>
              <span className="font-semibold">
                {stats.totalPosts > 0 
                  ? (stats.totalLikes / stats.totalPosts).toFixed(1) 
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Comments per Post</span>
              <span className="font-semibold">
                {stats.totalPosts > 0 
                  ? (stats.totalComments / stats.totalPosts).toFixed(1) 
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Posts per User</span>
              <span className="font-semibold">
                {stats.totalUsers > 0 
                  ? (stats.totalPosts / stats.totalUsers).toFixed(1) 
                  : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full btn-secondary text-left">
              View All Users
            </button>
            <button className="w-full btn-secondary text-left">
              View Reported Posts
            </button>
            <button className="w-full btn-secondary text-left">
              Export Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;