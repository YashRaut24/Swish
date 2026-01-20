import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { VALIDATION, USER_ROLES } from '../../utils/constants';

const Register = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.STUDENT,
    communityId: '',
    collegeName: '',
  });
  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await api.getCommunities();
        setCommunities(data.communities || []);
      } catch (err) {
        console.error('Failed to fetch communities:', err);
      }
    };
    fetchCommunities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'role' && value !== USER_ROLES.COMMUNITY ? { communityId: '' } : {}),
    });

    if (name === 'email') {
      if (value && formData.collegeName) {
        const regex = new RegExp(`^[^@]+@${formData.collegeName.toLowerCase()}\\.edu$`, 'i');
        if (!regex.test(value)) {
          setError("You don't belong to this campus. Please enter a valid email address.");
        } else {
          setError('');
        }
      } else if (value && !formData.collegeName) {
        setError('Please enter your college name first.');
      } else {
        setError('');
      }
    } else if (name === 'collegeName') {
      // Revalidate email if college name changes and email is present
      if (formData.email) {
        const regex = new RegExp(`^[^@]+@${value.toLowerCase()}\\.edu$`, 'i');
        if (!regex.test(formData.email)) {
          setError("You don't belong to this campus. Please enter a valid email address.");
        } else {
          setError('');
        }
      }
    } else {
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!formData.collegeName) {
      setError('Please enter your college name');
      return false;
    }

    if (formData.role === USER_ROLES.COMMUNITY && !formData.communityId) {
      setError('Please select a community');
      return false;
    }

    if (formData.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const regex = new RegExp(`^[^@]+@${formData.collegeName.toLowerCase()}\\.edu$`, 'i');
    if (!regex.test(formData.email)) {
      setError("You don't belong to this campus. Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registrationData } = formData;
      const data = await api.register({
        ...registrationData,
        bio: '',
        profilePicture: '',
      });

      login(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Join Swish</h1>
          <p className="text-gray-600">Create your campus profile</p>
        </div>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campus Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              autoComplete="new-password"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              autoComplete="new-password"
            />
          </div>

          {/* College Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              College Name *
            </label>
            <input
              name="collegeName"
              value={formData.collegeName}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value={USER_ROLES.STUDENT}>Student</option>
              <option value={USER_ROLES.FACULTY}>Faculty</option>
              <option value={USER_ROLES.COMMUNITY}>Community</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select "Community" if you're creating a community page
            </p>
          </div>

          {/* Community Selector */}
          {formData.role === USER_ROLES.COMMUNITY && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Community *
              </label>
              <select
                name="communityId"
                value={formData.communityId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="">Select a community</option>
                {communities.map((community) => (
                  <option key={community._id} value={community._id}>
                    {community.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the community you represent
              </p>
            </div>
          )}

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span className="text-lg">ℹ️</span>
              <span>You can add your profile photo and bio after creating your account</span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-gray-600 text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;