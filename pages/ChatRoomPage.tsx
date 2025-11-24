import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip } from 'lucide-react';
import { api } from '../services/api';
import { User, Message } from '../types';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';

interface ChatRoomPageProps {
  currentUser: User;
}

// Simple Pop Sound URL (Short Base64 or Data URI can be used, using a reliable CDN for a pop sound)
const SENT_SOUND_URL = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2239634044.mp3?filename=pop-39222.mp3"; 

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

  const playSentSound = () => {
    try {
        const audio = new Audio(SENT_SOUND_URL);
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play blocked", e));
    } catch(e) {}
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !partnerId) return;

    playSentSound();

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
    
    playSentSound();

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
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden relative">
      {/* Background Pattern - Softer */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`,
          backgroundRepeat: 'repeat'
      }}></div>

      {/* Modern Header */}
      <header className="flex-none bg-white/80 backdrop-blur-md text-gray-800 p-2 border-b border-gray-100 flex items-center justify-between shadow-sm h-20 z-20 rounded-b-3xl">
        <div className="flex items-center">
          <Link to="/" className="mr-2 hover:bg-gray-100 p-2.5 rounded-full text-gray-600 transition">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex items-center cursor-pointer">
            {partner ? (
              <div className="flex items-center">
                 <div className="relative">
                    <img 
                        src={partner.photo || "https://picsum.photos/40/40"} 
                        alt={partner.name} 
                        className="w-11 h-11 rounded-full bg-gray-200 object-cover border-2 border-white shadow-sm" 
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                 </div>
                 <div className="ml-3">
                   <h2 className="font-bold text-gray-800 text-base leading-tight">{partner.name}</h2>
                   <span className="text-xs text-teal-600 font-medium">Online</span>
                 </div>
              </div>
            ) : (
              <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
            )}
          </div>
        </div>
        <div className="flex space-x-2 text-teal-600 pr-2">
           <button onClick={handleCall} className="p-2.5 bg-teal-50 hover:bg-teal-100 rounded-full transition"><Phone size={20} /></button>
           <button onClick={handleCall} className="p-2.5 bg-teal-50 hover:bg-teal-100 rounded-full transition"><Video size={20} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = String(msg.sender_id) === String(currentUser.id) || String(msg.sender_id) === String(currentUser.uid);
          const nextIsMe = messages[idx + 1] && (String(messages[idx + 1].sender_id) === String(currentUser.id) || String(messages[idx + 1].sender_id) === String(currentUser.uid)) === isMe;
          
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
              <div 
                className={`max-w-[85%] px-4 py-3 shadow-sm relative transition-all ${
                  isMe 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                } ${!nextIsMe ? 'mb-2' : ''}`}
              >
                {msg.type === 'audio' ? (
                  <AudioMessage src={getAudioSrc(msg.content)} isMe={isMe} />
                ) : (
                  <p className="text-[15px] leading-relaxed break-words pb-1 font-normal">{msg.content}</p>
                )}
                
                <div className={`text-[10px] text-right mt-1 opacity-70 flex items-center justify-end gap-1 font-medium`}>
                   {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   {isMe && <span className="text-[10px]">✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex-none p-3 bg-white z-20 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-2">
            
            <button className="p-2 text-gray-400 hover:text-teal-600 transition"><Paperclip size={22} /></button>

            <div className="flex-1 bg-gray-100 rounded-[2rem] flex items-center px-4 py-1.5 focus-within:ring-2 focus-within:ring-teal-100 focus-within:bg-white transition-all duration-300">
                 <form onSubmit={handleSendText} className="flex-1 flex items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-transparent py-2.5 focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                 </form>
            </div>

            {inputText.length > 0 ? (
                 <button 
                    onClick={handleSendText}
                    disabled={sending}
                    className="bg-teal-600 text-white p-3.5 rounded-full shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-all active:scale-95"
                 >
                    <ArrowLeft className="rotate-180" size={24} />
                 </button>
            ) : (
                <div className="shadow-lg shadow-teal-500/20 rounded-full bg-teal-600">
                   <AudioRecorder onSend={handleSendAudio} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;