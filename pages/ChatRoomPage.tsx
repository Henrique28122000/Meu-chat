import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { api } from '../services/api';
import { User, Message } from '../types';
import AudioRecorder from '../components/AudioRecorder';

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
          const user = Array.isArray(data) ? data[0] : data;
          setPartner(user);
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
      console.error("Failed to load messages", error);
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
      console.error("Send failed", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    if (!partnerId) return;
    
    // Optimistic UI update with Blob URL
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
      // 1. Upload audio file
      const response = await api.uploadAudio(blob, currentUser.id, partnerId);
      
      // 2. If upload successful, send message with file path
      if (response.status === 'success' && response.file_path) {
        await api.sendMessage(currentUser.id, partnerId, response.file_path, 'audio');
        loadMessages(); // Refresh to get server ID and timestamp
      } else {
        console.error("Audio upload response invalid:", response);
      }
    } catch (error) {
      console.error("Audio upload failed", error);
    }
  };

  const getAudioSrc = (path: string) => {
    if (path.startsWith('blob:')) return path;
    if (path.startsWith('http')) return path;
    // Assuming uploads are inside /api/uploads/..., and BASE_URL points to /api
    return `https://paulohenriquedev.site/api/${path}`;
  };

  if (!partnerId) return <div>Invalid Chat</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white p-3 border-b flex items-center justify-between shadow-sm h-16 z-20">
        <div className="flex items-center">
          <Link to="/" className="mr-3 text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center">
            {partner ? (
              <>
                 <img 
                    src={partner.photo || "https://picsum.photos/40/40"} 
                    alt={partner.name} 
                    className="w-10 h-10 rounded-full bg-gray-200 mr-3 object-cover border" 
                 />
                 <div className="overflow-hidden">
                   <h2 className="font-semibold text-sm md:text-base text-gray-800 truncate max-w-[120px]">{partner.name}</h2>
                   <span className="text-xs text-green-500">Online</span>
                 </div>
              </>
            ) : (
              <div className="w-32 h-10 bg-gray-200 animate-pulse rounded"></div>
            )}
          </div>
        </div>
        <div className="flex space-x-1 text-gray-600">
           <button className="p-2 hover:bg-gray-100 rounded-full"><Phone size={20} /></button>
           <button className="p-2 hover:bg-gray-100 rounded-full"><Video size={20} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentUser.id || msg.sender_id === currentUser.uid;
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm break-words ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                }`}
              >
                {msg.type === 'audio' ? (
                  <div className="flex items-center space-x-2">
                     <span className="text-xs">🎤</span>
                     <audio 
                        src={getAudioSrc(msg.content)} 
                        controls 
                        className="h-8 w-48 max-w-full"
                     />
                  </div>
                ) : (
                  <p className="text-sm md:text-base">{msg.content}</p>
                )}
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                   {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-none p-2 bg-white border-t safe-area-bottom">
        <div className="flex items-center space-x-2">
            {inputText.length === 0 ? (
                <AudioRecorder onSend={handleSendAudio} />
            ) : null}
            
            <form onSubmit={handleSendText} className="flex-1 flex space-x-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 border border-gray-300 bg-gray-100 rounded-full px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                />
                {inputText.length > 0 && (
                    <button 
                    type="submit" 
                    disabled={sending}
                    className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                    >
                    <ArrowLeft className="rotate-180" size={20} />
                    </button>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;