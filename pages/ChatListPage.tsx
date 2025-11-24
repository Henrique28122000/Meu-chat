import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, Status } from '../types';
import { UserPlus, Search, MoreVertical, Camera, X } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'status'>('chats');
  const [statuses, setStatuses] = useState<Status[]>([]);
  
  // Status Viewer State
  const [viewingStatus, setViewingStatus] = useState<Status | null>(null);
  const [progress, setProgress] = useState(0);

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

  // Status Viewer Logic
  useEffect(() => {
    let timer: any;
    let interval: any;

    if (viewingStatus) {
      setProgress(0);
      const DURATION = 5000; // 5 seconds
      const UPDATE_FREQ = 50;

      timer = setTimeout(() => {
        setViewingStatus(null);
      }, DURATION);

      interval = setInterval(() => {
        setProgress(old => Math.min(old + (100 / (DURATION / UPDATE_FREQ)), 100));
      }, UPDATE_FREQ);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [viewingStatus]);

  const handlePostStatus = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
             const up = await api.uploadPhoto(file, currentUser.id);
             if(up.file_url) {
                 await api.postStatus(currentUser.id, up.file_url, "Status atualizado");
                 fetchStatuses();
             }
          } catch(err) {
              alert("Erro ao postar status");
          }
      }
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Modern Header with Gradient */}
      <header className="flex-none gradient-bg text-white shadow-lg z-10 rounded-b-3xl pt-2 pb-4 px-6 transition-all duration-300">
          <div className="flex justify-between items-center mb-4 pt-2">
            <h1 className="text-2xl font-bold tracking-tight">PH Chat</h1>
            <div className="flex items-center space-x-3 bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                <Link to="/search" className="p-2 hover:bg-white/20 rounded-full transition"><Search size={20} /></Link>
                <Link to="/profile" className="p-2 hover:bg-white/20 rounded-full transition"><MoreVertical size={20} /></Link>
            </div>
          </div>
          
          {/* Modern Tabs */}
          <div className="flex bg-black/10 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    activeTab === 'chats' ? 'bg-white text-teal-700 shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                  Conversas
              </button>
              <button 
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    activeTab === 'status' ? 'bg-white text-teal-700 shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                  Status
              </button>
          </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full bg-gray-50 rounded-t-2xl -mt-4 pt-6 z-0">
        
        {/* CHATS TAB */}
        {activeTab === 'chats' && (
            <>
                {loading && chats.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                ) : chats.length === 0 ? (
                <div className="text-center p-8 text-gray-500 flex flex-col items-center justify-center h-64 opacity-60">
                    <div className="bg-gray-200 p-4 rounded-full mb-4">
                        <UserPlus size={32} className="text-gray-400" />
                    </div>
                    <p className="mb-4 text-lg font-medium">Nenhuma conversa.</p>
                    <Link to="/search" className="text-teal-600 font-bold px-6 py-2 bg-teal-50 rounded-full hover:bg-teal-100 transition">Iniciar Chat</Link>
                </div>
                ) : (
                <ul className="pb-24 space-y-1 px-2">
                    {chats.map((chat, index) => {
                        const isMe = String(chat.sender_id) === String(currentUser.id);
                        const partnerId = isMe ? chat.receiver_id : chat.sender_id;
                        const name = chat.partner_name || "Usuário";
                        const photo = chat.partner_photo || "https://picsum.photos/50/50";
                        const message = chat.type === 'audio' ? '🎤 Mensagem de voz' : chat.content;
                        
                        return (
                        <li key={index}>
                            <Link to={`/chat/${partnerId}`} className="flex items-center px-4 py-3.5 bg-white mb-2 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                            <div className="relative">
                                <img 
                                src={photo} 
                                alt={name} 
                                className="w-14 h-14 rounded-2xl object-cover mr-4 shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/50/50?grayscale' }}
                                />
                                {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                <h3 className="text-base font-bold text-gray-800 truncate">{name}</h3>
                                <span className={`text-[11px] font-medium ${chat.unread > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                                    {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                </div>
                                <p className={`text-sm truncate flex items-center ${chat.unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                    {isMe && <span className="mr-1 text-teal-500 text-xs">✓</span>}
                                    {message}
                                </p>
                            </div>
                            </Link>
                        </li>
                        );
                    })}
                </ul>
                )}
                {/* Modern FAB */}
                <div className="absolute bottom-6 right-6 z-20">
                    <Link to="/search" className="flex items-center justify-center w-16 h-16 gradient-bg text-white rounded-3xl shadow-xl shadow-teal-500/30 hover:scale-105 transition-all">
                        <UserPlus size={26} />
                    </Link>
                </div>
            </>
        )}

        {/* STATUS TAB */}
        {activeTab === 'status' && (
            <div className="p-4">
                <div className="flex items-center mb-8 relative p-2 rounded-2xl hover:bg-white transition-colors">
                    <div className="relative group cursor-pointer">
                         <div className="w-16 h-16 rounded-2xl p-[3px] gradient-bg">
                            <img src={currentUser.photo || "https://picsum.photos/50/50"} className="w-full h-full rounded-xl object-cover border-2 border-white" />
                         </div>
                         <label className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1.5 rounded-full cursor-pointer border-2 border-white shadow-sm hover:scale-110 transition">
                             <UserPlus size={14} />
                             <input type="file" className="hidden" accept="image/*" onChange={handlePostStatus} />
                         </label>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-bold text-gray-900 text-lg">Meu Status</h3>
                        <p className="text-sm text-gray-500">Toque no + para adicionar</p>
                    </div>
                </div>
                
                <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider px-2">Atualizações Recentes</h4>
                {statuses.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Nenhum status disponível.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {statuses.map((st, i) => (
                             <div 
                                key={i} 
                                onClick={() => setViewingStatus(st)}
                                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm cursor-pointer group"
                             >
                                <img src={st.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                                    <h3 className="font-bold text-white text-sm truncate">{st.name}</h3>
                                    <p className="text-[10px] text-white/80">{new Date(st.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
                
                <div className="absolute bottom-6 right-6 z-20">
                    <label className="flex items-center justify-center w-14 h-14 bg-gray-800 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-black transition-all">
                        <Camera size={24} />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePostStatus} />
                    </label>
                </div>
            </div>
        )}
      </div>

      {/* STATUS VIEWER OVERLAY */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-600 mt-2 flex px-1 gap-1">
                <div className="h-full bg-white rounded-full transition-all ease-linear duration-100" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white z-10">
                <div className="flex items-center gap-3">
                    <img src={viewingStatus.photo} className="w-10 h-10 rounded-full border border-white/50" />
                    <div>
                        <h4 className="font-bold text-sm">{viewingStatus.name}</h4>
                        <span className="text-xs text-gray-300">Hoje, {new Date(viewingStatus.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
                <button onClick={() => setViewingStatus(null)}>
                    <X size={28} />
                </button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center bg-black relative">
                <img src={viewingStatus.image_url} className="max-h-full max-w-full object-contain" />
            </div>

            {/* Caption */}
            {viewingStatus.caption && (
                <div className="bg-black/50 backdrop-blur-md p-6 text-center text-white pb-10">
                    <p className="text-lg font-medium">{viewingStatus.caption}</p>
                </div>
            )}
        </div>
      )}

    </div>
  );
};

export default ChatListPage;