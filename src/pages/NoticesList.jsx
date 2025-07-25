import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function NoticeList() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        // Debugging
        console.log("Fetching notices with token:", token);
        
        const response = await fetch("http://localhost:5001/api/notices", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response status:", response);
        
        if (!response.ok) {
          // Handle token expiration
          if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to fetch notices");
        }

        const data = await response.json();
        console.log("Received notices:", data);
        
        // Transform data to match frontend expectations
        const transformedNotices = data.map(notice => ({
          ...notice,
          readCount: notice.readBy?.length || 0,
          priority: notice.priority || 'medium', // Default priority
          target: notice.target || 'All', // Default target
          status: notice.status || 'draft' // Default status
        }));
        
        setNotices(transformedNotices);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((notice) => {
    if (filter === "all") return true;
    return notice?.category?.toLowerCase() === filter.toLowerCase();
  });

  const getPriorityColor = (priority) => {
    const priorityValue = priority?.toLowerCase() || 'low';
    switch (priorityValue) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    const statusValue = status?.toLowerCase() || 'draft';
    switch (statusValue) {
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-md shadow-sm border mt-6">
        <div className="text-center py-8">Loading notices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-md shadow-sm border mt-6">
        <div className="text-red-600 text-center py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md shadow-sm border mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">All Notices</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="event">Event</option>
            <option value="general">General</option>
          </select>
          <Link 
            to="/CreateNotice"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 font-medium"
          >
            Create New
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="border-b font-medium text-gray-700">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Reads</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotices.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-gray-500 py-6">
                  No notices found. Create one to get started.
                </td>
              </tr>
            ) : (
              filteredNotices.map((notice) => (
                <tr key={notice.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {notice.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{notice.category}</td>
                  <td className="px-4 py-3">{notice.target}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notice.status)}`}>
                      {notice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {notice.createdAt ? format(new Date(notice.createdAt), "MMM d, yyyy") : 'N/A'}
                  </td>
                  <td className="px-4 py-3">{notice.readCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/notices/${notice.id}/analytics`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Analytics
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}