import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Plus, Shield, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PostCard from '../Post/PostCard';

const EventsView = ({ onLike, onComment, onDelete, onShare, onUserClick }) => {
  const { user, isFaculty } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventPosts, setEventPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', startTime: '', endTime: '', location: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [hostQuery, setHostQuery] = useState('');
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [hostSuggestions, setHostSuggestions] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null);
  const hostInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          hostInputRef.current && !hostInputRef.current.contains(event.target)) {
        setShowHostDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    try {
      const data = await api.getEventById(event._id);
      setEventPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load event details:', error);
      setEventPosts([]);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime) {
      setError('Title and date/time are required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.createEvent({
        ...newEvent,
        isVerified: isFaculty
      });
      setNewEvent({ title: '', description: '', startTime: '', endTime: '', location: '' });
      setHostQuery('');
      setSelectedHost(null);
      setShowCreateModal(false);
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const data = await api.joinEvent(eventId);
      // Update the event in the list
      setEvents(events.map(e => e._id === eventId ? data.event : e));
      if (selectedEvent && selectedEvent._id === eventId) {
        setSelectedEvent(data.event);
      }
    } catch (error) {
      console.error('Failed to join event:', error);
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'ended';
  };

  const isUserJoined = (event) => {
    return event.joinedUsers.some(u => u._id === user._id);
  };

  const handleHostInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setHostQuery(query);
    if (query.trim().length > 0) {
      try {
        const data = await api.searchUsers(query.trim());
        setHostSuggestions(data.users || []);
        setShowHostDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setHostSuggestions([]);
      }
    } else {
      setHostSuggestions([]);
      setShowHostDropdown(false);
    }
  }, []);

  const handleHostInputFocus = () => {
    if (hostSuggestions.length > 0) {
      setShowHostDropdown(true);
    }
  };

  const handleHostSelect = (user) => {
    setSelectedHost(user);
    setHostQuery('');
    setShowHostDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-md p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campus Events</h2>
          <p className="text-white/90 text-sm">
            Discover and join exciting events happening on campus
          </p>
        </div>
        {isFaculty && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium whitespace-nowrap"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {!selectedEvent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const status = getEventStatus(event);
            const joined = isUserJoined(event);

            return (
              <div
                key={event._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                    status === 'ongoing' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {status}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{new Date(event.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} />
                    <span>{event.joinedUsers.length} joined</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinEvent(event._id);
                  }}
                  disabled={status === 'ended'}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                    joined
                      ? 'bg-green-100 text-green-700'
                      : status === 'ended'
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {status === 'ended' ? 'Ended' : joined ? 'Joined' : 'Join Event'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Events
          </button>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedEvent.title}</h2>
                <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{new Date(selectedEvent.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{new Date(selectedEvent.startTime).toLocaleTimeString()} - {new Date(selectedEvent.endTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{selectedEvent.joinedUsers.length} joined</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                getEventStatus(selectedEvent) === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                getEventStatus(selectedEvent) === 'ongoing' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {getEventStatus(selectedEvent)}
              </div>
            </div>

            <button
              onClick={() => handleJoinEvent(selectedEvent._id)}
              disabled={getEventStatus(selectedEvent) === 'ended'}
              className={`py-2 px-6 rounded-lg font-medium transition ${
                isUserJoined(selectedEvent)
                  ? 'bg-green-100 text-green-700'
                  : getEventStatus(selectedEvent) === 'ended'
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {getEventStatus(selectedEvent) === 'ended' ? 'Ended' : isUserJoined(selectedEvent) ? 'Joined' : 'Join Event'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Related Posts</h3>
            {eventPosts.length > 0 ? (
              <div className="space-y-4">
                {eventPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={onLike}
                    onComment={onComment}
                    onDelete={onDelete}
                    onShare={onShare}
                    onUserClick={onUserClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg mb-2">No related posts yet</p>
                <p className="text-sm text-gray-400">Posts mentioning this event will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && isFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield size={24} className="text-purple-600" />
                Create Official Event
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Annual Seminar 2026"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows="3"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="e.g., Main Auditorium"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={100}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Host</label>
                <input
                  ref={hostInputRef}
                  type="text"
                  value={hostQuery}
                  onChange={handleHostInputChange}
                  onFocus={handleHostInputFocus}
                  placeholder="Search for a student or faculty member"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {showHostDropdown && hostSuggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {hostSuggestions.map((suggestion) => (
                      <div
                        key={suggestion._id}
                        onClick={() => handleHostSelect(suggestion)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      >
                        <img
                          src={suggestion.profilePic || '/default-avatar.png'}
                          alt={suggestion.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{suggestion.username}</div>
                          <div className="text-sm text-gray-500">{suggestion.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedHost && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedHost.profilePic || '/default-avatar.png'}
                      alt={selectedHost.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{selectedHost.username}</div>
                      <div className="text-sm text-gray-500">{selectedHost.role}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  ✓ This event will be marked as verified and official
                </p>
              </div>

              <button
                onClick={handleCreateEvent}
                disabled={creating}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsView;
