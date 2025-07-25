import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaUser, FaArrowLeft } from 'react-icons/fa';
import { format } from 'date-fns';

const NoticeAnalytics = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    readBy: [],
    totalReads: 0,
    targets: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  const fetchWithAuth = async (url, options = {}) => {
    try {
      // First attempt with current token
      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // If unauthorized, try refreshing token
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Session expired. Please login again.');
        }

        const refreshResponse = await fetch('http://localhost:5001/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh token expired. Please login again.');
        }

        const { accessToken } = await refreshResponse.json();
        localStorage.setItem('token', accessToken);

        // Retry original request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verify we have a token
        if (!localStorage.getItem('token')) {
          navigate('/login');
          return;
        }

        // Fetch both endpoints in parallel
        const [analyticsRes, usersRes] = await Promise.all([
          fetchWithAuth(`http://localhost:5001/api/notices/${noticeId}/analytics`),
          fetchWithAuth('http://localhost:5001/api/users')
        ]);

        const analyticsData = await analyticsRes.json();
        const usersData = await usersRes.json();

        setAnalytics(analyticsData);
        setUsers(usersData);

      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err.message);
        
        // Clear data to prevent showing stale information
        setAnalytics({ readBy: [], totalReads: 0, targets: {} });
        setUsers([]);
        
        // Redirect to login if unauthorized
        if (err.message.includes('401') || err.message.includes('expired')) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [noticeId, navigate]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md shadow-sm border mt-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-700">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Calculate analytics metrics
  const readers = analytics?.readBy?.map(item => item.userId) || [];
  const totalReads = analytics?.totalReads || 0;
  const userCount = users.length || 1; // Prevent division by zero

  return (
    <div className="bg-white p-6 rounded-md shadow-sm border mt-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to DashBoard
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Notice Read Analytics</h2>
      
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800">Total Sent</h3>
          <p className="text-3xl font-bold">{users.length}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-800">Read</h3>
          <p className="text-3xl font-bold">{totalReads}</p>
          <p className="text-sm text-green-600">
            {Math.round((totalReads / userCount) * 100)}% read rate
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Not Read</h3>
          <p className="text-3xl font-bold">{Math.max(0, users.length - totalReads)}</p>
          <p className="text-sm text-red-600">
            {Math.round(((users.length - totalReads) / userCount) * 100)}% not read
          </p>
        </div>
      </div>

      {/* Users Reading Status Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="border-b font-medium text-gray-700">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Read Time</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  {error ? "Error loading user data" : "No users available"}
                </td>
              </tr>
            ) : (
              users.map(user => {
                const readStatus = readers.includes(user.id);
                const readInfo = analytics.readBy?.find(item => item.userId === user.id);
                
                return (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center">
                      <FaUser className="mr-2 text-gray-400" />
                      {user.name || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3">{user.email || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {readStatus ? (
                        <span className="flex items-center text-green-600">
                          <FaCheckCircle className="mr-1" /> Read
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <FaTimesCircle className="mr-1" /> Not Read
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {readInfo?.readAt 
                        ? format(new Date(readInfo.readAt), "MMM d, yyyy 'at' h:mm a") 
                        : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          <p className="font-medium">Error: {error}</p>
          <div className="mt-2 flex space-x-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
            >
              Retry
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                navigate('/login');
              }}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeAnalytics;