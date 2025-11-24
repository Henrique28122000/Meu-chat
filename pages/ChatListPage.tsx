import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { UserPlus, Search } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]); // Typing as any[] because the exact API return structure for getMessages (list) is vague
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const data = await api.getChats(currentUser.id);
      // The API `getMessages.php` for a user usually returns a list of last messages/conversations
      // If data is array, set it.
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
    const interval = setInterval(fetchChats, 5000); // Poll every 5 seconds for list updates
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Helper to get other user's info from the chat object
  // Assuming the API returns something like { partner_id, partner_name, partner_photo, last_message, ... }
  // Since I don't have the exact PHP output for the list, I will implement a generic render that adapts.

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Chats</h1>
        <div className="flex space-x-2">
            <Link to="/search" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <Search size={24} />
            </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading && chats.length === 0 ? (
          <div className="flex justify-center items-center h-32">
             <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p className="mb-4">No conversations yet.</p>
            <Link to="/search" className="text-blue-500 font-medium">Find people to chat with</Link>
          </div>
        ) : (
          <ul>
            {chats.map((chat, index) => {
                // Heuristic to determine fields based on typical PHP implementations described
                const partnerId = chat.sender_id === currentUser.id ? chat.receiver_id : chat.sender_id;
                // If the API `getMessages` returns raw messages, we need to group them. 
                // However, usually a "Chat List" endpoint returns grouped data.
                // Assuming `chat` has `partner_name`, `partner_photo` etc. logic here might need adjustment based on exact JSON.
                // Fallback:
                const name = chat.partner_name || chat.name || "Unknown User";
                const photo = chat.partner_photo || chat.photo || "https://picsum.photos/50/50";
                const message = chat.content || (chat.type === 'audio' ? '🎤 Audio message' : '');
                
                return (
                  <li key={index}>
                    <Link to={`/chat/${partnerId}`} className="flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <img 
                        src={photo} 
                        alt={name} 
                        className="w-12 h-12 rounded-full object-cover mr-4 bg-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/50/50?grayscale' }}
                      />
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
      
      {/* Floating Action Button for New Chat */}
      <Link to="/search" className="absolute bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">
        <UserPlus size={24} />
      </Link>
    </div>
  );
};

export default ChatListPage;
