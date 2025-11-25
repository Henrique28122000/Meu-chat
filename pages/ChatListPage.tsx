
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { UserPlus, Search, Bell } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const data = await api.getChats(currentUser.id);
      if (Array.isArray(data)) setChats(data);
    } catch (error) {
      console.error("Erro ao buscar conversas", error);
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
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 bg-white rounded-b-[2rem] shadow-sm z-10 sticky top-0">
          <div className="flex justify-between items-center mb-2">
            <div>
                <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Conversas</h1>
                <p className="text-gray-400 text-xs font-medium">Suas mensagens recentes</p>
            </div>
            <div className="flex items-center gap-2">
                 <div className="bg-gray-100 p-2 rounded-full relative">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                 </div>
                 <img src={currentUser.photo} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
            </div>
          </div>
          
          <div className="mt-4 relative">
             <Search className="absolute left-3 top-3 text-gray-400" size={18} />
             <input type="text" placeholder="Pesquisar..." className="w-full bg-gray-100 text-gray-700 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
          </div>
      </header>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {loading && chats.length === 0 ? (
            <div className="flex justify-center mt-10">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : chats.length === 0 ? (
            <div className="text-center mt-20 opacity-60">
                <div className="bg-teal-50 p-6 rounded-full inline-block mb-4">
                    <UserPlus size={40} className="text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Comece a conversar!</h3>
                <p className="text-gray-400 text-sm mb-6">Encontre amigos para papear.</p>
                <Link to="/search" className="text-white font-bold px-8 py-3 bg-teal-600 rounded-full shadow-lg shadow-teal-500/30">
                    Buscar Pessoas
                </Link>
            </div>
        ) : (
            <ul className="space-y-3 pb-4">
                {chats.map((chat, index) => {
                    const isMe = String(chat.sender_id) === String(currentUser.id);
                    const partnerId = isMe ? chat.receiver_id : chat.sender_id;
                    const name = chat.partner_name || "Usuário";
                    const photo = chat.partner_photo || "https://picsum.photos/50/50";
                    
                    let preview = chat.content;
                    if(chat.type === 'audio') preview = '🎤 Áudio';
                    if(chat.content.includes('uploads/videos')) preview = '📹 Vídeo';
                    if(chat.content.includes('uploads/photos')) preview = '📷 Foto';

                    return (
                    <li key={index}>
                        <Link to={`/chat/${partnerId}`} className="flex items-center p-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]">
                        <div className="relative">
                            <img 
                            src={photo} 
                            alt={name} 
                            className="w-14 h-14 rounded-2xl object-cover mr-4 shadow-sm"
                            />
                            {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold">{chat.unread}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-base font-bold text-gray-800 truncate">{name}</h3>
                                <span className={`text-[10px] font-bold ${chat.unread > 0 ? 'text-teal-600' : 'text-gray-300'}`}>
                                    {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className={`text-sm truncate flex items-center ${chat.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                {isMe && <span className="mr-1 text-teal-500 text-xs">✓</span>}
                                {preview}
                            </p>
                        </div>
                        </Link>
                    </li>
                    );
                })}
            </ul>
        )}
      </div>

      <Link to="/search" className="fixed bottom-24 right-6 bg-gray-900 text-white p-4 rounded-3xl shadow-xl hover:scale-105 transition-transform z-40">
           <UserPlus size={24} />
      </Link>
    </div>
  );
};

export default ChatListPage;
