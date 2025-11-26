
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { User, Notification, formatTimeSP } from '../types';
import { Search, Camera, Bell, X } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.cleanupStatuses().catch(console.error);
  }, []);

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

  const fetchNotifications = async () => {
      try {
          const data = await api.getNotifications(currentUser.id);
          if(Array.isArray(data)) setNotifications(data);
      } catch (e) {}
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
      if(showNotifications) fetchNotifications();
  }, [showNotifications]);

  const goToProfile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(`/user/${id}`);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-20">
      {/* Premium Header */}
      <header className="px-5 py-4 gradient-bg text-white shadow-md z-10 sticky top-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold tracking-wide">PH Chat</h1>
            <div className="flex items-center gap-5">
                 <Link to="/status"><Camera size={22} /></Link>
                 <Link to="/search"><Search size={22} /></Link>
                 <button onClick={() => setShowNotifications(true)} className="relative">
                     <Bell size={22} />
                     <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#008069]"></span>
                 </button>
            </div>
          </div>
          
          <div className="flex text-white/70 font-bold text-sm uppercase">
              <span className="flex-1 pb-2 border-b-2 border-white text-white text-center">Conversas</span>
              <Link to="/status" className="flex-1 pb-2 text-center hover:text-white">Status</Link>
              <Link to="/discover" className="flex-1 pb-2 text-center hover:text-white">Descobrir</Link>
          </div>
      </header>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading && chats.length === 0 ? (
            <div className="flex justify-center mt-10">
                <div className="w-8 h-8 border-4 border-[#008069] border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : chats.length === 0 ? (
            <div className="text-center mt-20 opacity-60 px-6">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Sem conversas ainda</h3>
                <p className="text-gray-500 text-sm mb-6">Encontre amigos para papear.</p>
                <Link to="/search" className="text-white font-bold px-6 py-2 bg-[#008069] rounded-full shadow">
                    Buscar Contatos
                </Link>
            </div>
        ) : (
            <ul className="pb-4">
                {chats.map((chat, index) => {
                    const isMe = String(chat.sender_id) === String(currentUser.id);
                    const partnerId = isMe ? chat.receiver_id : chat.sender_id;
                    const name = chat.partner_name || "Usuário";
                    const photo = chat.partner_photo || "https://picsum.photos/50/50";
                    
                    let preview = "";
                    if (chat.type === 'audio') {
                        preview = '🎤 Mensagem de áudio';
                    } else if (chat.type === 'video' || (chat.content && chat.content.includes('uploads/videos'))) {
                        preview = '📹 Vídeo';
                    } else if (chat.type === 'image' || (chat.content && chat.content.includes('uploads/photos'))) {
                        preview = '📷 Foto';
                    } else {
                        preview = chat.content || "";
                    }

                    if (!preview) preview = "...";

                    return (
                    <li key={index}>
                        <Link to={`/chat/${partnerId}`} className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div onClick={(e) => goToProfile(e, partnerId)} className="relative cursor-pointer">
                            <img 
                            src={photo} 
                            alt={name} 
                            className="w-12 h-12 rounded-full object-cover mr-4 bg-gray-200 dark:bg-gray-700"
                            />
                        </div>
                        <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{name}</h3>
                                <span className={`text-xs ${chat.unread > 0 ? 'text-[#00a884] font-bold' : 'text-gray-400'}`}>
                                    {formatTimeSP(chat.timestamp)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className={`text-sm truncate flex-1 ${chat.unread > 0 ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {isMe && <span className="mr-1 text-gray-400 text-xs">✓✓</span>}
                                    {preview}
                                </p>
                                {chat.unread > 0 && (
                                    <span className="bg-[#25D366] text-white text-[10px] font-bold px-1.5 h-5 min-w-[20px] rounded-full flex items-center justify-center">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                        </Link>
                    </li>
                    );
                })}
            </ul>
        )}
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
              <div className="w-80 h-full bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-right flex flex-col">
                  <div className="p-4 bg-[#008069] text-white flex justify-between items-center">
                      <h2 className="font-bold">Notificações</h2>
                      <button onClick={() => setShowNotifications(false)}><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                          <p className="text-center text-gray-400 mt-10 text-sm">Nenhuma notificação recente.</p>
                      ) : (
                          notifications.map((notif, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
                                  <img src={notif.photo || "https://picsum.photos/40/40"} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                  <div className="text-sm">
                                      <p className="text-gray-800 dark:text-gray-200"><span className="font-bold">{notif.name}</span> {notif.content}</p>
                                      <span className="text-xs text-gray-400">{notif.timestamp ? formatTimeSP(notif.timestamp) : 'Hoje'}</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatListPage;