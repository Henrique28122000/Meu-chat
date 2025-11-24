
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Video } from 'lucide-react';
import { api } from '../services/api';
import { User, Message } from '../types';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';

interface ChatRoomPageProps {
  currentUser: User;
}

const ChatRoomPage: React.FC<ChatRoomPageProps> = ({ currentUser }) => {
  const { id: partnerId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // Load Partner Info
  useEffect(() => {
    if (partnerId) {
      api.getUser(partnerId).then(data => {
          setPartner(data as User);
      }).catch(err => console.error(err));
    }
  }, [partnerId]);

  // Load Messages & Poll
  const loadMessages = async () => {
    if (!partnerId || !currentUser.id) return;
    try {
      const msgs = await api.getChatMessages(currentUser.id, partnerId);
      if (Array.isArray(msgs)) {
          const sorted = msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setMessages(sorted);
      }
    } catch (error) {
      console.error("Falha ao carregar mensagens", error);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); 
    return () => clearInterval(interval);
  }, [partnerId, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !partnerId) return;

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      sender_id: currentUser.id,
      receiver_id: partnerId,
      content: inputText,
      type: 'text',
      timestamp: new Date().toISOString(),
      is_sent_by_me: true
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setSending(true);

    try {
      await api.sendMessage(currentUser.id, partnerId, tempMsg.content, 'text');
      loadMessages(); 
    } catch (error) {
      console.error("Falha ao enviar", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    if (!partnerId) return;
    
    // Optimistic UI
    const tempUrl = URL.createObjectURL(blob);
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      sender_id: currentUser.id,
      receiver_id: partnerId,
      content: tempUrl,
      type: 'audio',
      timestamp: new Date().toISOString(),
      is_sent_by_me: true
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await api.uploadAudio(blob, currentUser.id, partnerId);
      
      if (response.status === 'success' && response.file_path) {
        await api.sendMessage(currentUser.id, partnerId, response.file_path, 'audio');
        loadMessages(); 
      }
    } catch (error) {
      console.error("Falha upload audio", error);
    }
  };

  const getAudioSrc = (path: string) => {
    if (path.startsWith('blob:')) return path;
    if (path.startsWith('http')) return path;
    return `https://paulohenriquedev.site/api/${path}`;
  };

  const handleCall = () => {
    alert("Chamadas de voz e vídeo em breve!");
  }

  if (!partnerId) return <div>Chat Inválido</div>;

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
          backgroundRepeat: 'repeat'
      }}></div>

      {/* Header */}
      <header className="flex-none bg-[#008069] text-white p-2 border-b flex items-center justify-between shadow-md h-16 z-20">
        <div className="flex items-center">
          <Link to="/" className="mr-1 hover:bg-[#006e5a] p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center cursor-pointer">
            {partner ? (
              <>
                 <img 
                    src={partner.photo || "https://picsum.photos/40/40"} 
                    alt={partner.name} 
                    className="w-10 h-10 rounded-full bg-gray-300 mr-2 object-cover border border-white/30" 
                 />
                 <div className="overflow-hidden">
                   <h2 className="font-semibold text-base truncate max-w-[140px] leading-tight">{partner.name}</h2>
                   <span className="text-xs text-white/80">Online</span>
                 </div>
              </>
            ) : (
              <div className="w-32 h-10 bg-white/20 animate-pulse rounded"></div>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
           <button onClick={handleCall} className="p-2 hover:bg-[#006e5a] rounded-full"><Video size={22} /></button>
           <button onClick={handleCall} className="p-2 hover:bg-[#006e5a] rounded-full"><Phone size={20} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = String(msg.sender_id) === String(currentUser.id) || String(msg.sender_id) === String(currentUser.uid);
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm relative ${
                  isMe 
                    ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.type === 'audio' ? (
                  <AudioMessage src={getAudioSrc(msg.content)} isMe={isMe} />
                ) : (
                  <p className="text-[15px] leading-relaxed break-words pb-2">{msg.content}</p>
                )}
                
                <div className={`text-[10px] text-right absolute bottom-1 right-2 ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>
                   {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex-none p-2 bg-transparent z-20 pb-2">
        <div className="flex items-center space-x-2">
            
            <div className="flex-1 bg-white rounded-full flex items-center shadow-md px-2 py-1">
                 <form onSubmit={handleSendText} className="flex-1 flex items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Mensagem"
                        className="flex-1 bg-transparent px-3 py-2.5 focus:outline-none text-base"
                    />
                 </form>
                 <div className="flex items-center space-x-2 pr-1">
                     {/* Anexo seria aqui */}
                 </div>
            </div>

            {inputText.length > 0 ? (
                 <button 
                    onClick={handleSendText}
                    disabled={sending}
                    className="bg-[#008069] text-white p-3 rounded-full shadow-md hover:bg-[#006e5a] transition-transform active:scale-95"
                 >
                    <ArrowLeft className="rotate-180" size={24} />
                 </button>
            ) : (
                <div className="shadow-md rounded-full bg-[#008069]">
                   <AudioRecorder onSend={handleSendAudio} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;
