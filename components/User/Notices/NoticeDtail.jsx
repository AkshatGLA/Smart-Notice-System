import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaArrowLeft, FaBookOpen } from 'react-icons/fa';

const NoticeDetailPage = () => {
  const { noticeId } = useParams();
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/notices/${noticeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notice');
        }

        const data = await response.json();
        setNotice(data);

        // Mark as read when viewing details
        await fetch(`http://localhost:5001/api/notices/${noticeId}/read`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotice();
  }, [noticeId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        to="/notices" 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to Notices
      </Link>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                <FaBookOpen className="inline mr-2 text-blue-500" />
                {notice.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="capitalize">{notice.category}</span>
                <span>•</span>
                <span>{format(new Date(notice.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              notice.priority === 'high' ? 'bg-red-100 text-red-800' :
              notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {notice.priority || 'normal'}
            </span>
          </div>
          
          <div className="prose max-w-none text-gray-700 mt-6 whitespace-pre-line">
            {notice.content}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              This notice has been read by {notice.readCount || 0} {notice.readCount === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailPage;