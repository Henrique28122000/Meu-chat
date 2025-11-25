
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { Search, Camera } from 'lucide-react';

interface ChatListPageProps {
  currentUser: User;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Run only once on mount to clean old statuses
  useEffect(() => {
    api.cleanupStatuses().then(res => console.log("Status cleanup:", res)).catch(console.error);
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

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const goToProfile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(`/user/${id}`);
  }

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      {/* Premium Header */}
      <header className="px-5 py-4 bg-[#008069] text-white shadow-md z-10 sticky top-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold tracking-wide">PH Chat</h1>
            <div className="flex items-center gap-4">
                 <Link to="/status"><Camera size={22} /></Link>
                 <Link to="/search"><Search size={22} /></Link>
                 <img src={currentUser.photo} className="w-8 h-8 rounded-full border border-white/50" />
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
                <h3 className="text-lg font-bold text-gray-700">Sem conversas ainda</h3>
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
                    
                    let preview = chat.content;
                    if(chat.type === 'audio') preview = '🎤 Áudio';
                    if(chat.content.includes('uploads/videos')) preview = '📹 Vídeo';
                    if(chat.content.includes('uploads/photos')) preview = '📷 Foto';

                    // Se a mensagem for deletada e for a última, mostrar texto
                    // (A lógica de deleteMessage deve atualizar o content para 'Mensagem apagada' ou remover row. 
                    // Se remover row, pega a penultima. Se atualizar content, mostra aqui.)
                    
                    return (
                    <li key={index}>
                        <Link to={`/chat/${partnerId}`} className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div onClick={(e) => goToProfile(e, partnerId)} className="relative cursor-pointer">
                            <img 
                            src={photo} 
                            alt={name} 
                            className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                        </div>
                        <div className="flex-1 min-w-0 border-b border-gray-100 pb-3">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-base font-bold text-gray-900 truncate">{name}</h3>
                                <span className={`text-xs ${chat.unread > 0 ? 'text-[#00a884] font-bold' : 'text-gray-400'}`}>
                                    {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className={`text-sm truncate flex-1 ${chat.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
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
    </div>
  );
};

export default ChatListPage;