
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, Status } from '../types';
import { UserPlus, Search, MoreVertical, Camera } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'status'>('chats');
  const [statuses, setStatuses] = useState<Status[]>([]);

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

  const fetchStatuses = async () => {
      const data = await api.getStatuses();
      if(Array.isArray(data)) setStatuses(data);
  }

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    if(activeTab === 'status') fetchStatuses();
    return () => clearInterval(interval);
  }, [currentUser.id, activeTab]);

  const handlePostStatus = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Upload photo
          try {
             const up = await api.uploadPhoto(file, currentUser.id);
             if(up.file_url) {
                 await api.postStatus(currentUser.id, up.file_url, "Meu Status");
                 fetchStatuses();
                 alert("Status postado!");
             }
          } catch(err) {
              alert("Erro ao postar status");
          }
      }
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header WhatsApp Style */}
      <header className="flex-none bg-[#008069] text-white shadow-md z-10">
          <div className="flex justify-between items-center p-4 pb-2">
            <h1 className="text-xl font-bold tracking-wide">PH Chat</h1>
            <div className="flex items-center space-x-4">
                <Link to="/search"><Search size={22} /></Link>
                <Link to="/profile"><MoreVertical size={22} /></Link>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex text-sm font-medium uppercase mt-2">
              <button 
                onClick={() => setActiveTab('chats')}
                className={`flex-1 pb-3 text-center border-b-[3px] transition-all ${
                    activeTab === 'chats' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white/80'
                }`}
              >
                  Conversas
              </button>
              <button 
                onClick={() => setActiveTab('status')}
                className={`flex-1 pb-3 text-center border-b-[3px] transition-all ${
                    activeTab === 'status' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white/80'
                }`}
              >
                  Status
              </button>
          </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full bg-white">
        
        {/* CHATS TAB */}
        {activeTab === 'chats' && (
            <>
                {loading && chats.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-[#008069] border-t-transparent rounded-full animate-spin"></div>
                </div>
                ) : chats.length === 0 ? (
                <div className="text-center p-8 text-gray-500 flex flex-col items-center justify-center h-64">
                    <p className="mb-4 text-lg">Nenhuma conversa ainda.</p>
                    <Link to="/search" className="text-[#008069] font-bold px-4 py-2 bg-green-50 rounded-lg">Iniciar conversa</Link>
                </div>
                ) : (
                <ul className="pb-24 divide-y divide-gray-100">
                    {chats.map((chat, index) => {
                        const isMe = String(chat.sender_id) === String(currentUser.id);
                        const partnerId = isMe ? chat.receiver_id : chat.sender_id;
                        const name = chat.partner_name || "Usuário";
                        const photo = chat.partner_photo || "https://picsum.photos/50/50";
                        const message = chat.type === 'audio' ? '🎤 Mensagem de voz' : chat.content;
                        
                        return (
                        <li key={index}>
                            <Link to={`/chat/${partnerId}`} className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="relative">
                                <img 
                                src={photo} 
                                alt={name} 
                                className="w-12 h-12 rounded-full object-cover mr-4 bg-gray-200"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/50/50?grayscale' }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                <h3 className="text-base font-medium text-gray-900 truncate">{name}</h3>
                                <span className={`text-xs ${chat.unread > 0 ? 'text-[#25D366] font-bold' : 'text-gray-400'}`}>
                                    {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate flex items-center">
                                    {isMe && <span className="mr-1 text-gray-400">✓</span>}
                                    {message}
                                </p>
                            </div>
                            </Link>
                        </li>
                        );
                    })}
                </ul>
                )}
                {/* FAB */}
                <div className="absolute bottom-6 right-6 z-20">
                    <Link to="/search" className="flex items-center justify-center w-14 h-14 bg-[#008069] text-white rounded-2xl shadow-lg hover:bg-[#006e5a] transition-all">
                    <UserPlus size={24} />
                    </Link>
                </div>
            </>
        )}

        {/* STATUS TAB */}
        {activeTab === 'status' && (
            <div className="p-4">
                <div className="flex items-center mb-6 relative">
                    <div className="relative">
                         <img src={currentUser.photo || "https://picsum.photos/50/50"} className="w-12 h-12 rounded-full opacity-90" />
                         <label className="absolute bottom-0 right-0 bg-[#008069] text-white p-1 rounded-full cursor-pointer border-2 border-white">
                             <UserPlus size={14} />
                             <input type="file" className="hidden" accept="image/*" onChange={handlePostStatus} />
                         </label>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-bold text-gray-900">Meu Status</h3>
                        <p className="text-sm text-gray-500">Toque para atualizar</p>
                    </div>
                </div>
                
                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Recentes</h4>
                {statuses.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhum status recente.</p>
                ) : (
                    <ul className="space-y-4">
                        {statuses.map((st, i) => (
                             <li key={i} className="flex items-center">
                                <div className="p-[2px] rounded-full border-2 border-[#008069]">
                                    <img src={st.image_url} className="w-12 h-12 rounded-full object-cover border-2 border-white" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-bold text-gray-900">{st.name}</h3>
                                    <p className="text-xs text-gray-500">{new Date(st.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                             </li>
                        ))}
                    </ul>
                )}
                
                {/* Camera FAB for Status */}
                <div className="absolute bottom-6 right-6 z-20">
                    <label className="flex items-center justify-center w-14 h-14 bg-[#008069] text-white rounded-full shadow-lg cursor-pointer hover:bg-[#006e5a]">
                        <Camera size={24} />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePostStatus} />
                    </label>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default ChatListPage;
