
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Status, User } from '../types';
import { Plus, X, Camera, Video, Mic } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';

interface StatusPageProps {
  currentUser: User;
}

const StatusPage: React.FC<StatusPageProps> = ({ currentUser }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [viewingStatus, setViewingStatus] = useState<Status | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  
  // Create Status State
  const [file, setFile] = useState<File | Blob | null>(null);
  const [type, setType] = useState<'image' | 'video' | 'audio' | 'text'>('image');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchStatuses = async () => {
      const data = await api.getStatuses();
      if(Array.isArray(data)) setStatuses(data);
  }

  useEffect(() => {
      fetchStatuses();
  }, []);

  const handlePost = async () => {
      if(!file) return;
      setUploading(true);
      try {
          let url = '';
          if(type === 'image') {
              const res = await api.uploadPhoto(file as File, currentUser.id);
              if(res.file_url) url = res.file_url;
          } else if (type === 'video') {
              const res = await api.uploadVideo(file as File, currentUser.id);
              if(res.file_url) url = res.file_url;
          } else if (type === 'audio') {
              const res = await api.uploadAudio(file as Blob, currentUser.id);
              if(res.file_path) url = `https://paulohenriquedev.site/api/${res.file_path}`;
          }

          if(url) {
              await api.postStatus(currentUser.id, url, type, caption);
              fetchStatuses();
              setShowCreator(false);
              setFile(null); setPreview(null); setCaption('');
          }
      } catch(e) {
          alert("Erro ao postar status");
      } finally {
          setUploading(false);
      }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, t: 'image' | 'video') => {
      if(e.target.files && e.target.files[0]){
          setFile(e.target.files[0]);
          setType(t);
          setPreview(URL.createObjectURL(e.target.files[0]));
      }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <header className="px-6 py-5 bg-white shadow-sm z-10 sticky top-0 rounded-b-3xl flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-700">Status</h1>
          <button onClick={() => setShowCreator(true)} className="p-2 bg-gray-100 rounded-full hover:bg-teal-50 transition">
              <Plus size={24} className="text-teal-600" />
          </button>
      </header>

      <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
           {/* My Status Card */}
           <div onClick={() => setShowCreator(true)} className="aspect-[3/4] rounded-2xl bg-white border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition relative overflow-hidden group">
               <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition"></div>
               <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-2 z-10">
                   <Plus size={24} className="text-teal-600" />
               </div>
               <span className="text-xs font-bold text-gray-500 z-10">Novo Status</span>
           </div>

           {statuses.map((st, i) => (
               <div key={i} onClick={() => setViewingStatus(st)} className="aspect-[3/4] rounded-2xl bg-black relative overflow-hidden cursor-pointer shadow-md group">
                   {st.media_type === 'image' && <img src={st.media_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />}
                   {st.media_type === 'video' && <video src={st.media_url} className="w-full h-full object-cover opacity-80" />}
                   {st.media_type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600"><Mic size={32} className="text-white" /></div>}
                   
                   <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                       <h3 className="text-white text-xs font-bold truncate">{st.name}</h3>
                       <p className="text-white/70 text-[10px]">{new Date(st.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                   </div>
                   <div className="absolute top-2 left-2 p-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                       <img src={st.photo} className="w-6 h-6 rounded-full" />
                   </div>
               </div>
           ))}
      </div>

      {/* Creator Modal */}
      {showCreator && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
              <div className="flex justify-between p-4 bg-black text-white">
                  <button onClick={() => setShowCreator(false)}><X /></button>
                  <span className="font-bold">Novo Status</span>
                  <button onClick={handlePost} disabled={!file || uploading} className="text-teal-400 font-bold disabled:opacity-50">Postar</button>
              </div>
              <div className="flex-1 bg-black flex flex-col items-center justify-center relative">
                  {!file ? (
                      <div className="flex gap-8">
                          <label className="flex flex-col items-center text-white gap-2 cursor-pointer">
                              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"><Camera size={32}/></div>
                              <span className="text-xs font-bold">Foto</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')} />
                          </label>
                          <label className="flex flex-col items-center text-white gap-2 cursor-pointer">
                              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"><Video size={32}/></div>
                              <span className="text-xs font-bold">Vídeo</span>
                              <input type="file" accept="video/*" className="hidden" onChange={e => handleFile(e, 'video')} />
                          </label>
                          <div className="flex flex-col items-center text-white gap-2 cursor-pointer relative">
                               <div className="scale-125"><AudioRecorder onSend={(blob) => { setFile(blob); setType('audio'); setPreview(URL.createObjectURL(blob)); }} /></div>
                               <span className="text-xs font-bold mt-2">Áudio</span>
                          </div>
                      </div>
                  ) : (
                      <>
                        {type === 'image' && <img src={preview!} className="max-w-full max-h-[60vh] object-contain" />}
                        {type === 'video' && <video src={preview!} controls className="max-w-full max-h-[60vh]" />}
                        {type === 'audio' && <audio src={preview!} controls className="w-full p-8" />}
                        <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-4 right-4 bg-gray-800/80 text-white p-2 rounded-full"><X/></button>
                      </>
                  )}
              </div>
              <div className="p-4 bg-black">
                  <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Adicionar legenda..." className="w-full bg-gray-900 text-white p-3 rounded-xl outline-none" />
              </div>
          </div>
      )}

       {/* Viewer Modal */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="absolute top-2 left-2 right-2 h-1 bg-gray-700 z-20"><div className="h-full bg-white animate-[progress_5s_linear]" onAnimationEnd={() => setViewingStatus(null)}></div></div>
            <div className="flex items-center justify-between p-4 text-white z-10 mt-2">
                <div className="flex items-center gap-3">
                    <img src={viewingStatus.photo} className="w-10 h-10 rounded-full border border-white/50" />
                    <div><h4 className="font-bold text-sm">{viewingStatus.name}</h4><span className="text-xs text-gray-300">Há pouco</span></div>
                </div>
                <button onClick={() => setViewingStatus(null)}><X size={28} /></button>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
                 {viewingStatus.media_type === 'image' && <img src={viewingStatus.media_url} className="max-w-full max-h-full" />}
                 {viewingStatus.media_type === 'video' && <video src={viewingStatus.media_url} autoPlay className="max-w-full max-h-full" />}
                 {viewingStatus.media_type === 'audio' && <div className="p-10 bg-white/10 rounded-3xl backdrop-blur"><AudioMessage src={viewingStatus.media_url} isMe={false} /></div>}
            </div>
            {viewingStatus.caption && <div className="p-6 text-center text-white bg-black/50 backdrop-blur absolute bottom-0 w-full"><p className="text-lg">{viewingStatus.caption}</p></div>}
        </div>
      )}
    </div>
  );
};

export default StatusPage;
