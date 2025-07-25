import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaHistory, FaChartBar } from 'react-icons/fa';
import { format } from 'date-fns';

const NoticeReadAnalytics = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/notices/${noticeId}/reads`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [noticeId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaChartBar className="mr-2 text-blue-500" />
          Notice Reading Analytics
        </h2>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Notice: {analytics.notice_title || 'Untitled'}</h3>
        <p className="text-sm text-gray-600">Total Reads: {analytics.total_reads || 0}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Read Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Read</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analytics.reads.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No reading data available</td>
              </tr>
            ) : (
              Object.entries(
                analytics.reads.reduce((acc, read) => {
                  if (!acc[read.user_id]) {
                    acc[read.user_id] = {
                      user_name: read.user_name || 'null',
                      user_email: read.user_email || 'null',
                      roll_number: read.roll_number || 'null',
                      department: read.department || 'null',
                      course: read.course || 'null',
                      section: read.section || 'null',
                      last_read: null,
                      count: 0
                    };
                  }
                  const timestamp = new Date(read.timestamp);
                  if (!acc[read.user_id].last_read || timestamp > new Date(acc[read.user_id].last_read)) {
                    acc[read.user_id].last_read = read.timestamp;
                  }
                  acc[read.user_id].count++;
                  return acc;
                }, {})
              ).map(([user_id, data]) => (
                <tr key={user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FaUser className="flex-shrink-0 h-5 w-5 text-purple-400 mr-3" />
                      {data.user_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.user_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.roll_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.last_read ? format(new Date(data.last_read), 'MMM d, yyyy HH:mm') : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NoticeReadAnalytics;