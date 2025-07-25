import { FaArrowRight, FaFacebookF, FaGoogle, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Redirect to login page after successful signup
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl flex overflow-hidden">
        {/* Left Form Side */}
        <div className="w-full md:w-1/2 p-10">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-gray-400 hover:text-gray-600">
              &larr;
            </Link>
            <p className="text-sm text-gray-500">
              Already member?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h2>
          <p className="text-sm text-gray-500 mb-8">
            Secure Your Communications with SmartNotice
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex items-center border-b border-gray-300 py-2">
              <FaUser className="text-gray-400 mr-3" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full outline-none py-2 text-sm"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="flex items-center border-b border-gray-300 py-2">
              <FaEnvelope className="text-gray-400 mr-3" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full outline-none py-2 text-sm"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <div className="flex items-center border-b border-gray-300 py-2">
                <FaLock className="text-gray-400 mr-3" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full outline-none py-2 text-sm"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>
              <div className="text-xs text-green-600 mt-2 space-y-1">
                <p>✔ At least 6 characters</p>
                <p>✔ Includes a number or symbol</p>
                <p>✔ Includes lowercase and uppercase letters</p>
              </div>
            </div>
            
            <div className="flex items-center border-b border-gray-300 py-2">
              <FaLock className="text-gray-400 mr-3" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-type Password"
                className="w-full outline-none py-2 text-sm"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-full hover:from-blue-600 hover:to-indigo-600 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up <FaArrowRight />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 mt-4">
              <button type="button" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <FaFacebookF className="text-blue-600" />
              </button>
              <button type="button" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <FaGoogle className="text-red-500" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Graphic Side */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-500 to-blue-500 text-white p-10 items-center justify-center relative overflow-hidden">
          <div className="space-y-6 text-center">
            <div className="bg-white rounded-xl p-6 text-black shadow-md">
              <h4 className="text-xs text-gray-400 mb-1">Inbox</h4>
              <p className="text-xl font-semibold">176,18</p>
              <p className="text-sm text-gray-500 mt-1">↗ 45 new</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-black shadow-md">
              <h4 className="text-sm font-semibold mb-1">
                Your data, your rules
              </h4>
              <p className="text-xs text-gray-500">
                Your data belongs to you, and our encryption ensures that.
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-4 opacity-25 text-7xl font-bold rotate-12 pointer-events-none">
            🔒
          </div>
        </div>
      </div>
    </div>
  );
}