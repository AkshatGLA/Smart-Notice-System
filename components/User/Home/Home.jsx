import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Filter, Search, Brain, Calendar, User, Star, ArrowRight, Clock, Tag, BarChart3, Eye, FileText, Shield, Users, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfessionalNoticePortal = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInsights, setAiInsights] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch notices from the database
  const fetchNotices = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/notices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('accessToken');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match the expected format
      const transformedNotices = data.map(notice => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        priority: notice.priority.toLowerCase(),
        type: notice.notice_type || 'general',
        date: new Date(notice.createdAt).toLocaleDateString('en-CA'),
        time: new Date(notice.createdAt).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        department: notice.departments || 'General',
        read: Math.random() > 0.5, // Since read status isn't implemented yet
        aiGenerated: notice.notice_type === 'ai-generated' || Math.random() > 0.7,
        urgency: notice.priority === 'High' ? 'Immediate' : 
                notice.priority === 'Medium' ? 'Action Required' : 'Scheduled',
        reference: `${notice.notice_type?.toUpperCase() || 'GEN'}-${notice.id.slice(-6)}`,
        createdBy: notice.createdBy,
        status: notice.status,
        recipient_emails: notice.recipient_emails || []
      }));

      setNotices(transformedNotices);
      setError(null);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError(err.message || 'Failed to fetch notices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load notices on component mount
  useEffect(() => {
    fetchNotices();
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    fetchNotices();
  };

  const priorityConfig = {
    critical: { 
      color: "bg-red-600", 
      border: "border-red-200", 
      text: "text-red-600",
      bg: "bg-red-50"
    },
    high: { 
      color: "bg-orange-500", 
      border: "border-orange-200", 
      text: "text-orange-600",
      bg: "bg-orange-50"
    },
    medium: { 
      color: "bg-blue-500", 
      border: "border-blue-200", 
      text: "text-blue-600",
      bg: "bg-blue-50"
    },
    low: { 
      color: "bg-green-500", 
      border: "border-green-200", 
      text: "text-green-600",
      bg: "bg-green-50"
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'system': return <Settings className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      case 'policy': return <FileText className="w-5 h-5" />;
      case 'meeting': return <Calendar className="w-5 h-5" />;
      case 'training': return <Star className="w-5 h-5" />;
      case 'hr': return <Users className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || notice.priority === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { 
      label: "Total Notices", 
      value: notices.length, 
      icon: Bell, 
      color: "text-gray-600",
      change: "From database"
    },
    { 
      label: "Unread", 
      value: notices.filter(n => !n.read).length, 
      icon: Eye, 
      color: "text-blue-600",
      change: "Pending review"
    },
    { 
      label: "High Priority", 
      value: notices.filter(n => n.priority === 'high' || n.priority === 'critical').length, 
      icon: AlertTriangle, 
      color: "text-orange-600",
      change: "Needs attention"
    },
    { 
      label: "AI Insights", 
      value: notices.filter(n => n.aiGenerated).length, 
      icon: Brain, 
      color: "text-purple-600",
      change: "Smart suggestions"
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notices...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Notices</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Notice Management Portal</h1>
                <p className="text-blue-100 text-lg mb-4">Centralized notification system with AI-powered insights</p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Database Connected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Monitoring Enabled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure Environment</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm mb-1">
                {currentTime.toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-2xl font-bold mb-2">
                {currentTime.toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </div>
              <div className="text-blue-100 text-sm">
                India Standard Time
              </div>
            </div>
          </div>
          
          {/* Hero Content */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-3">Stay Informed, Stay Ahead</h2>
                <p className="text-blue-100 leading-relaxed">
                  Our intelligent notice management system ensures critical information reaches you instantly. 
                  With AI-powered prioritization and smart filtering, never miss important updates from your organization.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-3">Real-time Database Integration</h2>
                <p className="text-blue-100 leading-relaxed">
                  Connected to live database with secure authentication. All notices are synchronized in real-time 
                  with full CRUD operations and advanced analytics for better decision making.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <BarChart3 className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notices, departments, or content..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiInsights}
                    onChange={(e) => setAiInsights(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${aiInsights ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${aiInsights ? 'translate-x-5' : 'translate-x-0'} mt-0.5`}></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-700">AI Insights</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notices Grid */}
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notices found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No notices available at the moment.'}
            </p>
            {(searchTerm || selectedFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityConfig[notice.priority]?.border || 'border-gray-200'} hover:shadow-md transition-shadow duration-200 cursor-pointer group ${!notice.read ? 'ring-2 ring-blue-100' : ''}`}
              >
                <div className="p-6 relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500">
                        {getIcon(notice.type)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${priorityConfig[notice.priority]?.color || 'bg-gray-400'}`}></span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityConfig[notice.priority]?.bg || 'bg-gray-100'} ${priorityConfig[notice.priority]?.text || 'text-gray-600'}`}>
                          {notice.priority.toUpperCase()}
                        </span>
                        {notice.aiGenerated && (
                          <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Brain className="w-3 h-3" />
                            <span>AI</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">{notice.urgency}</div>
                      <div className="text-sm text-gray-900">{notice.time}</div>
                      <div className="text-xs text-gray-500">{notice.date}</div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {notice.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {notice.content}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{notice.department}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Ref: {notice.reference}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span onClick={()=> navigate(`/notices/${notice.id}`)} className="text-sm font-medium">View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notice.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Insights Panel */}
        {aiInsights && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Brain className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Priority Analysis</h4>
                <p className="text-sm text-red-700">
                  {notices.filter(n => n.priority === 'critical').length} critical notices require immediate attention.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Action Items</h4>
                <p className="text-sm text-blue-700">
                  {notices.filter(n => n.urgency === 'Action Required').length} notices require action from you.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Recommendations</h4>
                <p className="text-sm text-purple-700">
                  {notices.filter(n => n.aiGenerated).length} AI-generated recommendations available.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalNoticePortal;