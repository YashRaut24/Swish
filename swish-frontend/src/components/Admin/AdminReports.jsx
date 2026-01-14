import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../services/api';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReports();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (reportId, action) => {
    try {
      await api.handleReport(reportId, action);
      loadReports();
    } catch (error) {
      console.error('Failed to handle report:', error);
    }
  };

  const filteredReports = reports.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Reported Posts</h2>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            {reports.filter(r => r.status === 'pending').length} Pending
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Approved ({reports.filter(r => r.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rejected ({reports.filter(r => r.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report._id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">
                      Reported by: {report.reporterName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      report.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {report.status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReport(report._id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <CheckCircle size={16} />
                    <span>Remove Post</span>
                  </button>
                  <button
                    onClick={() => handleReport(report._id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    <XCircle size={16} />
                    <span>Keep Post</span>
                  </button>
                </div>
              )}

              {report.status !== 'pending' && report.handledAt && (
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                  Handled on {new Date(report.handledAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Eye size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No {filter} reports</p>
          <p className="text-sm text-gray-400">
            {filter === 'pending' 
              ? 'All clear! No pending reports at the moment.' 
              : `No reports have been ${filter}.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;