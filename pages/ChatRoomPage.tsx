
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, Paperclip, MoreVertical, Trash2, Camera } from 'lucide-react';
import { api } from '../services/api';
import { User, Message, formatTimeSP } from '../types';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';

interface ChatRoomPageProps {
  currentUser: User;
}

const SENT_SOUND_URL = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2239634044.mp3?filename=pop-39222.mp3"; 

const ChatRoomPage: React.FC<ChatRoomPageProps> = ({ currentUser }) => {
  const { id: partnerId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (partnerId) {
      api.getUser(partnerId).then(data => {
          setPartner(data as User);
      }).catch(err => console.error(err));
    }
  }, [partnerId]);

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
        audio.play().catch(e => {});
    } catch(e) {}
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !partnerId) return;

    playSentSound();
    const content = inputText;
    setInputText('');
    setSending(true);

    try {
      await api.sendMessage(currentUser.id, partnerId, content, 'text');
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

  const handleDelete = async () => {
      if(!selectedMsgId) return;
      if(confirm("Apagar esta mensagem?")) {
        try {
            await api.deleteMessage(selectedMsgId, currentUser.id);
            setSelectedMsgId(null);
            setMessages(prev => prev.filter(m => m.id !== selectedMsgId));
        } catch(e) {
            alert("Erro ao deletar");
        }
      }
  }

  const goToProfile = () => {
      if(partnerId) navigate(`/user/${partnerId}`);
  }

  if (!partnerId) return <div>Chat Inválido</div>;

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] overflow-hidden relative">
      {/* WhatsApp Background */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
          backgroundImage: `url("https://i.pinimg.com/originals/97/c0/07/97c00759d90d786d9b6096d274ad3e07.png")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px'
      }}></div>

      {/* Header */}
      <header className="flex-none bg-[#008069] text-white p-2 flex items-center justify-between shadow-md z-20 h-16">
        <div className="flex items-center">
          <Link to="/" className="mr-1 p-2 rounded-full active:bg-white/20">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex items-center cursor-pointer" onClick={goToProfile}>
            <img 
                src={partner?.photo || "https://picsum.photos/40/40"} 
                className="w-9 h-9 rounded-full bg-gray-200 object-cover mr-2" 
            />
            <div className="flex flex-col">
                <h2 className="font-bold text-base leading-tight">{partner?.name || '...'}</h2>
                <span className="text-[10px] opacity-80">Clique para ver dados</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-4 pr-3">
           <Video size={22} />
           <Phone size={20} />
           <MoreVertical size={20} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = String(msg.sender_id) === String(currentUser.id);

          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                onClick={() => isMe ? setSelectedMsgId(msg.id) : null}
                className={`max-w-[80%] px-2 py-1.5 shadow-sm rounded-lg relative text-sm select-none ${
                  isMe 
                    ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none cursor-pointer' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                <>
                    {msg.type === 'audio' ? (
                    <AudioMessage src={getAudioSrc(msg.content)} isMe={isMe} />
                    ) : (
                    <p className="pb-1 px-1">{msg.content}</p>
                    )}
                </>
                
                <div className={`text-[9px] text-gray-500 text-right flex items-center justify-end gap-1 mt-0.5`}>
                   {formatTimeSP(msg.timestamp)}
                   {isMe && (
                       <span className={msg.is_read ? "text-blue-500" : "text-gray-400"}>
                           <svg viewBox="0 0 16 15" width="16" height="11" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.473-.018l5.614-7.533a.419.419 0 0 0-.06-.546zm-6.918 6.566l.492.368a.365.365 0 0 0 .509-.063l.142-.187a.32.32 0 0 1 .484-.033l.358.325a.319.319 0 0 0 .484-.032l.378-.483a.418.418 0 0 0-.036-.541l-1.32-1.266a.33.33 0 0 0-.473.018l-.13.175a.419.419 0 0 0 .06.546l.128.118-1.076-1.034a.42.42 0 0 0-.58.016l-1.32 1.266a.33.33 0 0 0-.473.018l-3.32 4.456a.419.419 0 0 0 .06.546l.478.372a.365.365 0 0 0 .51-.063l2.847-3.82a.32.32 0 0 1 .484-.033l1.192 1.09z"></path></svg>
                       </span>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-none p-2 bg-transparent z-20 pb-2 px-2 flex gap-1 items-end">
        <div className="flex-1 bg-white rounded-3xl flex items-end p-1 shadow-sm min-h-[45px]">
            <button className="p-2 text-gray-400"><Paperclip size={20} /></button>
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mensagem"
                className="flex-1 bg-transparent py-2.5 px-2 focus:outline-none text-gray-700 placeholder-gray-400 resize-none max-h-24 overflow-y-auto"
                rows={1}
            />
             <div className="p-2"><Camera size={20} className="text-gray-400" /></div>
        </div>

        {inputText.length > 0 ? (
             <button 
                onClick={handleSendText}
                disabled={sending}
                className="w-11 h-11 bg-[#008069] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition"
             >
                <div className="ml-1 -rotate-45"><svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg></div>
             </button>
        ) : (
             <div className="mb-0.5"><AudioRecorder onSend={handleSendAudio} /></div>
        )}
      </div>

      {selectedMsgId && (
          <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setSelectedMsgId(null)}>
              <div className="bg-white rounded-lg shadow-xl p-4 w-64 space-y-3" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-gray-700 text-center mb-2">Opções</h3>
                  <button onClick={handleDelete} className="w-full p-2 bg-red-500 text-white rounded font-bold hover:opacity-90 flex items-center justify-center gap-2">
                      <Trash2 size={18} /> Apagar Mensagem
                  </button>
                  <button onClick={() => setSelectedMsgId(null)} className="w-full p-2 text-gray-500 text-sm">Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatRoomPage;
