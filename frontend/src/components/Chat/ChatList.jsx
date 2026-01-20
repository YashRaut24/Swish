import React, { useState, useEffect } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ChatWindow from './ChatWindow';

const ChatList = ({ initialChat }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentSelectedChat, setCurrentSelectedChat] = useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (initialChat) {
      // Open chat with the specified user
      setSelectedChat({
        userId: initialChat.userId,
        userName: initialChat.userName,
        messages: []
      });
    }
  }, [initialChat]);

  const loadChats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getChats();
      
      // Group messages by conversation
      const chatMap = {};
      data.chats.forEach(chat => {
        const myId = String(user._id);
        const participants = (chat.participants || []).map(p => typeof p === 'object' ? (p._id || p) : p).map(String);
        const otherUserId = participants.find(id => id !== myId);

        if (!chatMap[otherUserId]) {
          const lastMessage = chat.messages[chat.messages.length - 1];
          const unread = chat.messages.some(m => !m.seenBy.includes(myId) && m.sender.toString() !== myId);
          chatMap[otherUserId] = {
            chatId: chat._id,
            userId: otherUserId,
            userName: 'Loading...',
            lastMessage: lastMessage ? lastMessage.text : '',
            timestamp: lastMessage ? lastMessage.createdAt : '',
            unread,
            messages: chat.messages.map(m => {
              const senderId = typeof m.sender === 'object' ? String(m.sender._id || m.sender) : String(m.sender);
              return {
                senderId: senderId,
                recipientId: senderId === myId ? otherUserId : myId,
                message: m.text,
                timestamp: m.createdAt,
              };
            })
          };
        }
      });
      
      const chatList = Object.values(chatMap);
      
      // Fetch user details for each chat
      const chatsWithNames = await Promise.all(
        chatList.map(async (chat) => {
          try {
            console.log('Fetching user for ID:', chat.userId, 'Type:', typeof chat.userId);
            const userData = await api.getUserById(chat.userId);
            return {
              ...chat,
              userName: userData.user?.username || userData.user?.name || 'User'
            };
          } catch (error) {
            console.error('Failed to fetch user:', error);
            return chat;
          }
        })
      );
      
      setChats(chatsWithNames);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedChat) {
    return (
      <ChatWindow
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
        onSendMessage={loadChats}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Messages</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredChats.length > 0 ? (
          <div>
            {filteredChats.map((chat) => (
              <div
                key={chat.userId}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-100 transition group"
              >
                <div
                  onClick={() => setSelectedChat(chat)}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {chat.userName[0].toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800 truncate">{chat.userName}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                  
                  {chat.unread && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this chat?')) {
                      try {
                        // Need to find the actual chat ID from backend
                        await loadChats();
                      } catch (error) {
                        console.error('Failed to delete chat:', error);
                      }
                    }
                  }}
                  className="p-2 hover:bg-red-100 rounded-full transition opacity-0 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <span className="text-red-600 text-lg">×</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={64} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Start a conversation with someone</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;