import React, { useState, useEffect } from 'react';
import { Users, Eye, Shield, Flag, Activity, Trash2, EyeOff, CheckCircle, XCircle, Search, Filter, AlertTriangle, FileText } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'content-monitoring', label: 'Content Monitoring', icon: Eye },
    { id: 'content-moderation', label: 'Content Moderation', icon: Shield },
    { id: 'reports-handling', label: 'Reports Handling', icon: Flag },
    { id: 'user-activity', label: 'User Activity', icon: Users },
  ];

  useEffect(() => {
    if (activeTab !== 'overview') {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'content-monitoring':
        case 'content-moderation':
          const postsRes = await api.get('/admin/posts');
          setPosts(postsRes.data.posts);
          break;
        case 'reports-handling':
          const reportsRes = await api.get('/admin/reports');
          setReports(reportsRes.data.reports);
          break;
        case 'user-activity':
          const usersRes = await api.get('/admin/users/activity');
          setUsers(usersRes.data.users);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleHidePost = async (postId, hidden) => {
    try {
      await api.patch(`/admin/posts/${postId}/hide`, { hidden });
      setPosts(posts.map(post =>
        post._id === postId ? { ...post, isHidden: hidden } : post
      ));
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleResolveReport = async (reportId, resolution) => {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`, { resolution });
      setReports(reports.map(report =>
        report._id === reportId
          ? { ...report, status: 'resolved', resolution, resolvedAt: new Date() }
          : report
      ));
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
  };

  const handleBlockUser = async (userId, blocked) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { blocked });
      setUsers(users.map(user =>
        user._id === userId ? { ...user, isBlocked: blocked } : user
      ));
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true;
    return report.status === filterStatus;
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Dashboard Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition" onClick={() => setActiveTab('content-monitoring')}>
                <div className="flex items-center space-x-2">
                  <Eye className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-blue-600">Content Monitoring</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Monitor all posts and content</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition" onClick={() => setActiveTab('content-moderation')}>
                <div className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-green-600">Content Moderation</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Moderate and hide inappropriate content</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg cursor-pointer hover:bg-orange-100 transition" onClick={() => setActiveTab('reports-handling')}>
                <div className="flex items-center space-x-2">
                  <Flag className="w-6 h-6 text-orange-600" />
                  <span className="font-semibold text-orange-600">Reports Handling</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Review and resolve user reports</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg cursor-pointer hover:bg-purple-100 transition" onClick={() => setActiveTab('user-activity')}>
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  <span className="font-semibold text-purple-600">User Activity</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Manage user accounts and activity</p>
              </div>
            </div>
          </div>
        );
      case 'content-monitoring':
        return <ContentMonitoring posts={posts} loading={loading} />;
      case 'content-moderation':
        return <ContentModeration posts={posts} onHidePost={handleHidePost} loading={loading} />;
      case 'reports-handling':
        return <ReportsHandling reports={filteredReports} onResolveReport={handleResolveReport} loading={loading} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />;
      case 'user-activity':
        return <UserActivity users={filteredUsers} onBlockUser={handleBlockUser} loading={loading} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />;
      default:
        return null;
    }
  };

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

      {/* Tabs */}
      <div className="card p-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.view)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition text-gray-600 hover:bg-gray-100"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Content */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">Dashboard Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Eye className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-blue-600">Content Monitoring</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Monitor all posts and content</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-600">Content Moderation</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Moderate and hide inappropriate content</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Flag className="w-6 h-6 text-orange-600" />
              <span className="font-semibold text-orange-600">Reports Handling</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Review and resolve user reports</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="font-semibold text-purple-600">User Activity</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Manage user accounts and activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentMonitoring = ({ posts }) => (
  <div>
    <h3 className="text-xl font-bold mb-4">All Posts</h3>
    {posts.length === 0 ? (
      <div className="text-center py-8 text-gray-500">No posts found</div>
    ) : (
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="border rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {post.media?.[0]?.url ? (
                <img
                  src={post.media[0].url}
                  alt="Post"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{post.author?.username || 'Unknown'}</p>
                <p className="text-sm text-gray-600">{post.caption || 'No caption'}</p>
                <p className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ContentModeration = ({ posts, onHidePost }) => (
  <div>
    <h3 className="text-xl font-bold mb-4">Moderate Content</h3>
    {posts.length === 0 ? (
      <div className="text-center py-8 text-gray-500">No posts found</div>
    ) : (
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {post.media?.[0]?.url ? (
                  <img
                    src={post.media[0].url}
                    alt="Post"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{post.author?.username || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{post.caption || 'No caption'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onHidePost(post._id, !post.isHidden)}
                className={`flex items-center space-x-2 px-3 py-1 rounded ${
                  post.isHidden
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {post.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{post.isHidden ? 'Show' : 'Hide'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ReportsHandling = ({ reports, onResolveReport }) => (
  <div>
    <h3 className="text-xl font-bold mb-4">Reported Content</h3>
    {reports.length === 0 ? (
      <div className="text-center py-8 text-gray-500">No reports found</div>
    ) : (
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report._id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">Report by {report.reporter?.username || 'Unknown'}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Reason: {report.reason}</p>
                <p className="text-xs text-gray-500">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              {report.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onResolveReport(report._id, 'removed')}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => onResolveReport(report._id, 'ignored')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Ignore
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const UserActivity = ({ users, onBlockUser }) => (
  <div>
    <h3 className="text-xl font-bold mb-4">User Management</h3>
    {users.length === 0 ? (
      <div className="text-center py-8 text-gray-500">No users found</div>
    ) : (
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user._id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">Role: {user.role} | Posts: {user.postCount}</p>
              </div>
              <button
                onClick={() => onBlockUser(user._id, !user.isBlocked)}
                className={`px-3 py-1 rounded ${
                  user.isBlocked
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {user.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default AdminDashboard;
