import React, { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, AlertTriangle, Users, FileText, EyeOff, Flag, LogOut } from 'lucide-react';
import { VIEWS } from '../../utils/constants';
import AdminDashboard from '../Admin/AdminDashboard';
import AdminReports from '../Admin/AdminReports';
import api from '../../services/api';

const AdminLayout = ({ currentView, onViewChange, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentView]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentView) {
        case VIEWS.CONTENT_MONITORING:
          const postsRes = await api.get('/admin/posts');
          setPosts(postsRes.data.posts);
          break;
        case VIEWS.REPORTS_HANDLING:
          const reportsRes = await api.get('/admin/reports');
          setReports(reportsRes.data.reports);
          break;
        case VIEWS.USER_ACTIVITY:
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

  const adminNavItems = [
    { view: VIEWS.ADMIN_DASHBOARD, icon: Shield, label: 'Admin Dashboard', color: 'text-red-600' },
    { view: VIEWS.CONTENT_MONITORING, icon: Eye, label: 'Content Monitoring', color: 'text-blue-600' },
    { view: VIEWS.CONTENT_MODERATION, icon: CheckCircle, label: 'Content Moderation', color: 'text-green-600' },
    { view: VIEWS.REPORTS_HANDLING, icon: AlertTriangle, label: 'Reports Handling', color: 'text-orange-600' },
    { view: VIEWS.USER_ACTIVITY, icon: Users, label: 'User Activity', color: 'text-purple-600' },
  ];

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

  const renderView = () => {
    switch (currentView) {
      case VIEWS.ADMIN_DASHBOARD:
        return <AdminDashboard onViewChange={onViewChange} />;
      case VIEWS.REPORTS_HANDLING:
        return <AdminReports />;
      case VIEWS.CONTENT_MONITORING:
        return loading ? <div className="text-center py-8">Loading...</div> : <ContentMonitoring posts={posts} />;
      case VIEWS.CONTENT_MODERATION:
        return loading ? <div className="text-center py-8">Loading...</div> : <ContentModeration posts={posts} onHidePost={handleHidePost} />;
      case VIEWS.USER_ACTIVITY:
        return loading ? <div className="text-center py-8">Loading...</div> : <UserActivity users={users} onBlockUser={handleBlockUser} />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>

          <nav className="space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => onViewChange(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    isActive
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? item.color : ''} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {renderView()}
      </main>
    </div>
  );
};

export default AdminLayout;
