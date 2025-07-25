import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaArrowLeft,
  FaBullhorn,
  FaChartLine,
  FaUsers,
  FaNewspaper,
  FaEdit,
  FaTrash,
  FaChartBar,
  FaEye
} from 'react-icons/fa';
import { format } from 'date-fns';

const AllNoticesAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalNotices: 0,
    totalReads: 0,
    totalUsers: 0,
    notices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchWithAuth = async (url, options = {}) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
      };

      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      if (response.status === 401) {
        const refreshResponse = await fetch('http://localhost:5001/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!refreshResponse.ok) {
          throw new Error('Session expired. Please login again.');
        }

        const { accessToken } = await refreshResponse.json();
        localStorage.setItem('token', accessToken);

        headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return response;
    } catch (err) {
      console.error(`API call failed: ${url}`, err);
      throw err;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/auth/current-user');
      const userData = await response.json();
      setCurrentUser(userData);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const deleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      await fetchWithAuth(`http://localhost:5001/api/notices/${noticeId}`, {
        method: 'DELETE'
      });
      // Refresh the data after deletion
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!localStorage.getItem('token')) {
        navigate('/login');
        return;
      }

      await fetchCurrentUser();

      const [noticesRes, usersRes] = await Promise.all([
        fetchWithAuth('http://localhost:5001/api/notices'),
        fetchWithAuth('http://localhost:5001/api/users/count').catch(() => ({ json: () => ({ count: 0 }) }))
      ]);

      const noticesData = await noticesRes.json();
      const usersData = await usersRes.json();

      const totalReads = noticesData.reduce((sum, notice) => sum + (notice.recipient_emails?.length || 0), 0);

      const noticesWithReadCount = noticesData.map(notice => ({
        ...notice,
        readCount: notice.recipient_emails?.length || 0
      }));

      setAnalytics({
        totalNotices: noticesData.length,
        totalReads,
        totalUsers: usersData.count || 0,
        notices: noticesWithReadCount
      });

    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err.message);

      if (err.message.includes('401') || err.message.includes('expired')) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border mt-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaChartLine className="mr-2 text-blue-500" />
          All Notices Dashboard
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <FaNewspaper className="text-blue-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-medium text-blue-800">Total Notices</h3>
              <p className="text-3xl font-bold">{analytics.totalNotices}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-800">Total Reads</h3>
              <p className="text-3xl font-bold">{analytics.totalReads}</p>
              <p className="text-sm text-green-600 mt-1">
                {analytics.totalUsers > 0 && analytics.totalNotices > 0
                  ? `${Math.round((analytics.totalReads / (analytics.totalNotices * analytics.totalUsers)) * 100)}% overall read rate`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center">
            <FaUsers className="text-purple-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-medium text-purple-800">Active Users</h3>
              <p className="text-3xl font-bold">{analytics.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notices Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sender
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Published
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reads
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analytics.notices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  {error ? "Error loading notices" : "No notices available"}
                </td>
              </tr>
            ) : (
              analytics.notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaBullhorn className="flex-shrink-0 h-5 w-5 text-blue-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {notice.title}
                        <div className="text-xs text-gray-500 mt-1">
                          {notice.content.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUser className="flex-shrink-0 h-5 w-5 text-purple-400 mr-3" />
                      <div className="text-sm text-gray-900">
                        {notice.createdBy?.name || 'Unknown'}
                        <div className="text-xs text-gray-500">
                          {notice.createdBy?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {notice.noticeType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${notice.status === 'published' ? 'bg-green-100 text-green-800' :
                        notice.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {notice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {notice.publishAt ? format(new Date(notice.publishAt), 'MMM d, yyyy') : 'Not published'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {notice.readCount} / {analytics.totalUsers}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/notices/${notice.id}/analytics`)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Analytics"
                      >
                        <FaChartBar />
                      </button>


                      <button
                        onClick={() => navigate(`/notices/${notice.id}/read-analytics`)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 flex items-center"
                        title="View Analytics"
                      >
                        <FaChartBar className="mr-1" />
                        <FaEye className="text-sm" />
                      </button>

                      {(currentUser?.role === 'admin' || currentUser?.id === notice.createdBy?.id) && (
                        <>
                          <button
                            onClick={() => navigate(`/notices/edit/${notice.id}`)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                            title="Edit Notice"
                          >
                            <FaEdit />
                          </button>


                          <button
                            onClick={() => deleteNotice(notice.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete Notice"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-2 flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                >
                  Login Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllNoticesAnalytics;