import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { UserPlus, Search, User as UserIcon } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const data = await api.getChats(currentUser.id);
      if (Array.isArray(data)) {
        setChats(data);
      }
    } catch (error) {
      console.error("Error fetching chats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="flex-none p-4 border-b bg-white flex justify-between items-center z-10 shadow-sm h-16">
        <h1 className="text-xl font-bold text-gray-800">Messages</h1>
        <div className="flex items-center space-x-3">
            <Link to="/search" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <Search size={24} />
            </Link>
            <Link to="/profile" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <UserIcon size={24} />
            </Link>
        </div>
      </header>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto w-full">
        {loading && chats.length === 0 ? (
          <div className="flex justify-center items-center h-32">
             <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center p-8 text-gray-500 flex flex-col items-center justify-center h-64">
            <p className="mb-4 text-lg">No conversations yet.</p>
            <Link to="/search" className="text-blue-600 font-medium px-4 py-2 bg-blue-50 rounded-lg">Find people</Link>
          </div>
        ) : (
          <ul className="pb-24"> {/* Added padding bottom so FAB doesn't cover last item */}
            {chats.map((chat, index) => {
                const partnerId = chat.sender_id === currentUser.id ? chat.receiver_id : chat.sender_id;
                const name = chat.partner_name || chat.name || "Unknown User";
                const photo = chat.partner_photo || chat.photo || "https://picsum.photos/50/50";
                
                // Fix: Correctly check message type for preview
                const message = chat.type === 'audio' ? '🎤 Audio message' : chat.content;
                
                return (
                  <li key={index}>
                    <Link to={`/chat/${partnerId}`} className="flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <div className="relative">
                        <img 
                          src={photo} 
                          alt={name} 
                          className="w-12 h-12 rounded-full object-cover mr-4 bg-gray-200 border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/50/50?grayscale' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
                          <span className="text-xs text-gray-400">{new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{message}</p>
                      </div>
                    </Link>
                  </li>
                );
            })}
          </ul>
        )}
      </div>
      
      {/* FAB */}
      <div className="absolute bottom-6 right-6 z-20">
        <Link to="/search" className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">
          <UserPlus size={24} />
        </Link>
      </div>
    </div>
  );
};

export default ChatListPage;