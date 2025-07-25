import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaBookOpen, FaSearch, FaFilter } from 'react-icons/fa';

const NoticeListPage = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5001/api/notices', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch notices');
      }

      const data = await response.json();
      
      const transformedNotices = data.map(notice => ({
        ...notice,
        // For UI display purposes
        target: [notice.departments, notice.year, notice.section].filter(Boolean).join(' • ') || 'All'
      }));
      
      setNotices(transformedNotices);
      setFilteredNotices(transformedNotices);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    let results = notices;

    // Apply type filter
    if (filter !== 'all') {
      results = results.filter(notice => 
        notice.notice_type?.toLowerCase() === filter.toLowerCase()
      );
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(notice => 
        notice.title.toLowerCase().includes(term) || 
        notice.content.toLowerCase().includes(term)
      );
    }

    setFilteredNotices(results);
  }, [searchTerm, filter, notices]);

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          <FaBookOpen className="inline mr-2 text-blue-500" />
          Notices Board
        </h1>
        
        <div className="w-full md:w-auto flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notices..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No notices found</h3>
          <p className="text-gray-500">
            {searchTerm || filter !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "There are no notices available at this time"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredNotices.map((notice) => (
            <NoticeCard 
              key={notice.id} 
              notice={notice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NoticeCard = ({ notice }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-200 ${expanded ? 'ring-2 ring-blue-500' : ''}`}>
      <div 
        className={`p-6 cursor-pointer ${expanded ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              {notice.title}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
              <span className="capitalize">{notice.notice_type || 'general'}</span>
              <span>•</span>
              <span>{notice.target}</span>
              <span>•</span>
              <span>{format(new Date(notice.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            notice.priority === 'high' ? 'bg-red-100 text-red-800' :
            notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {notice.priority || 'medium'}
          </span>
        </div>
        
        {expanded && (
          <div className="mt-4">
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
              {notice.content}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div className="flex space-x-4">
                <span className="text-sm text-gray-500">
                  Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    notice.status === 'published' ? 'bg-blue-100 text-blue-800' :
                    notice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {notice.status || 'draft'}
                  </span>
                </span>
                {notice.recipient_emails?.length > 0 && (
                  <span className="text-sm text-gray-500">
                    Sent to: {notice.recipient_emails.length} recipients
                  </span>
                )}
              </div>
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
              >
                Collapse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeListPage;