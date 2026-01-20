import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { connectSocket, getSocket } from '../../sockets';

const ChatWindow = ({ chat, onBack, onSendMessage }) => {
  const { user } = useAuth();

  console.log("Current User ID:", user?._id);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize messages only when user is loaded
  useEffect(() => {
    if (user && user._id && chat.messages) {
      const processedMessages = (chat.messages || []).map(m => {
        const senderId = m.senderId || (typeof m.sender === 'object' ? String(m.sender._id || m.sender) : String(m.sender));
        return {
          senderId: senderId,
          recipientId: senderId === String(user._id) ? String(chat.userId) : String(user._id),
          message: m.text || m.message || '',
          timestamp: m.createdAt,
        };
      });
      setMessages(processedMessages);
    }
  }, [user, chat.messages, chat.userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chat.chatId) {
      api.markChatAsRead(chat.chatId).catch(console.error);
    }
  }, [chat.chatId]);

  useEffect(() => {
    if (!user || !user._id) return;

    const sock = connectSocket();
    if (!sock) return;
    const handler = (payload) => {
      const { from, text, message, createdAt } = payload || {};
      const messageText = text || message;
      if (!from || !messageText) return;
      if (from === chat.userId || from === user._id) {
        setMessages((prev) => [
          ...prev,
          {
            senderId: String(from),
            recipientId: String(from) === String(user._id) ? String(chat.userId) : String(user._id),
            message: messageText,
            timestamp: createdAt || new Date().toISOString()
          },
        ]);
      }
    };
    sock.on('chat:message', handler);
    return () => {
      try { getSocket()?.off('chat:message', handler); } catch {}
    };
  }, [chat.userId, user._id, user]);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const result = await api.sendMessage(chat.userId, message);
      console.log('Send message result:', result);
      if (result?.message) {
        console.log('Adding message to state:', result.message);
        // Ensure sent message has correct senderId
        const sentMessage = {
          ...result.message,
          senderId: String(user._id), // Force current user as sender
          recipientId: String(chat.userId)
        };
        setMessages([...messages, sentMessage]);
      }
      setMessage('');
      onSendMessage && onSendMessage();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    if (!date || isNaN(date.getTime())) {
      return 'Now';
    }
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md h-[calc(100vh-12rem)] flex flex-col">
      {}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
            {chat.userName[0].toUpperCase()}
          </div>
          
          <div>
            <p className="font-semibold text-gray-800">{chat.userName}</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <Phone size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <Video size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!user || !user._id ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            console.log("Message Sender ID:", msg.senderId);
            const className = msg.senderId === user._id ? 'sent' : 'received';

          return (
            <div
              key={index}
              className={`flex ${className === 'sent' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  className === 'sent'
                    ? 'bg-[#0084ff] text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm break-words font-medium">
                  {msg.message && msg.message.trim() ? msg.message : 'Message content unavailable'}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    className === 'sent' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="1"
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
