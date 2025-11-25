
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Status, User, Viewer } from '../types';
import { Plus, X, Camera, Video, Mic, Trash2, Eye } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';

interface StatusPageProps {
  currentUser: User;
}

const StatusPage: React.FC<StatusPageProps> = ({ currentUser }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [viewingStatus, setViewingStatus] = useState<Status | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [viewers, setViewers] = useState<Viewer[] | null>(null);
  
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

  // When viewing status
  useEffect(() => {
      if(viewingStatus) {
          setViewers(null);
          // Mark as viewed if not me
          if(viewingStatus.user_id !== currentUser.id) {
              api.viewStatus(viewingStatus.id, currentUser.id);
          }
      }
  }, [viewingStatus, currentUser.id]);

  const fetchViewers = async () => {
      if(viewingStatus) {
          const v = await api.getStatusViewers(viewingStatus.id);
          setViewers(v);
      }
  }

  const deleteStatus = async () => {
      if(!viewingStatus) return;
      if(confirm("Excluir status?")) {
          await api.deleteStatus(viewingStatus.id, currentUser.id);
          setViewingStatus(null);
          fetchStatuses();
      }
  }

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      <header className="px-5 py-4 bg-[#008069] text-white shadow-sm z-10 sticky top-0 flex justify-between items-center">
          <h1 className="text-xl font-bold">Status</h1>
          <div className="flex gap-4">
            <button onClick={() => setShowCreator(true)} className="p-1 rounded-full hover:bg-white/10 transition">
                <Camera size={22} />
            </button>
          </div>
      </header>

      <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto">
           {/* My Status Card */}
           <div onClick={() => setShowCreator(true)} className="aspect-[9/16] rounded-xl bg-gray-100 border border-gray-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
               <div className="w-10 h-10 rounded-full bg-[#008069] flex items-center justify-center mb-2 shadow-lg">
                   <Plus size={20} className="text-white" />
               </div>
               <span className="text-xs font-bold text-gray-500">Meu Status</span>
           </div>

           {statuses.map((st, i) => (
               <div key={i} onClick={() => setViewingStatus(st)} className="aspect-[9/16] rounded-xl bg-black relative overflow-hidden cursor-pointer shadow-sm group">
                   {st.media_type === 'image' && <img src={st.media_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />}
                   {st.media_type === 'video' && <video src={st.media_url} className="w-full h-full object-cover opacity-90" />}
                   {st.media_type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600"><Mic size={24} className="text-white" /></div>}
                   
                   <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                       <h3 className="text-white text-[10px] font-bold truncate">{st.name}</h3>
                   </div>
                   <div className={`absolute top-2 left-2 p-0.5 rounded-full border-2 ${st.user_id === currentUser.id ? 'border-green-500' : 'border-blue-500'}`}>
                       <img src={st.photo} className="w-6 h-6 rounded-full" />
                   </div>
               </div>
           ))}
      </div>

      {/* Creator Modal */}
      {showCreator && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-bottom">
              <div className="flex justify-between p-4 bg-black/50 absolute top-0 w-full z-10 text-white">
                  <button onClick={() => setShowCreator(false)}><X /></button>
                  <span className="font-bold">Novo Status</span>
                  <button onClick={handlePost} disabled={!file || uploading} className="bg-[#008069] px-4 py-1 rounded-full text-sm font-bold disabled:opacity-50">Enviar</button>
              </div>
              <div className="flex-1 bg-black flex flex-col items-center justify-center relative">
                  {!file ? (
                      <div className="flex gap-8">
                          <label className="flex flex-col items-center text-white gap-2 cursor-pointer">
                              <div className="w-16 h-16 rounded-full border border-white flex items-center justify-center hover:bg-white/10 transition"><Camera size={32}/></div>
                              <span className="text-xs font-bold">Foto</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')} />
                          </label>
                          <label className="flex flex-col items-center text-white gap-2 cursor-pointer">
                              <div className="w-16 h-16 rounded-full border border-white flex items-center justify-center hover:bg-white/10 transition"><Video size={32}/></div>
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
                        {type === 'image' && <img src={preview!} className="max-w-full max-h-[80vh] object-contain" />}
                        {type === 'video' && <video src={preview!} controls className="max-w-full max-h-[80vh]" />}
                        {type === 'audio' && <audio src={preview!} controls className="w-full p-8" />}
                        <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-16 right-4 bg-black/50 text-white p-2 rounded-full"><X/></button>
                      </>
                  )}
              </div>
              <div className="p-4 bg-black relative z-10">
                  <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Adicionar legenda..." className="w-full bg-gray-800 text-white p-3 rounded-full outline-none text-center" />
              </div>
          </div>
      )}

       {/* Full Screen Viewer */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                 {/* Progress Bar placeholder - simulates timer */}
                 <div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                     <div className="h-full bg-white animate-[progress_5s_linear]" onAnimationEnd={() => setViewingStatus(null)}></div>
                 </div>
            </div>

            <div className="flex items-center justify-between p-4 pt-6 text-white z-10">
                <div className="flex items-center gap-3">
                    <img src={viewingStatus.photo} className="w-10 h-10 rounded-full border border-white/50" />
                    <div><h4 className="font-bold text-sm">{viewingStatus.name}</h4><span className="text-xs text-gray-300">Há pouco</span></div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Owner controls */}
                    {viewingStatus.user_id === currentUser.id && (
                        <button onClick={deleteStatus} className="p-2"><Trash2 size={24} /></button>
                    )}
                    <button onClick={() => setViewingStatus(null)}><X size={28} /></button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative bg-gray-900">
                 {viewingStatus.media_type === 'image' && <img src={viewingStatus.media_url} className="max-w-full max-h-full" />}
                 {viewingStatus.media_type === 'video' && <video src={viewingStatus.media_url} autoPlay className="max-w-full max-h-full" />}
                 {viewingStatus.media_type === 'audio' && <div className="p-10 bg-white/10 rounded-3xl backdrop-blur"><AudioMessage src={viewingStatus.media_url} isMe={false} /></div>}
            </div>
            
            <div className="absolute bottom-10 w-full flex flex-col items-center text-white z-20 pb-4">
                {viewingStatus.caption && <p className="text-lg bg-black/30 p-2 rounded mb-4">{viewingStatus.caption}</p>}
                
                {/* Viewers Eye for Owner */}
                {viewingStatus.user_id === currentUser.id && (
                    <button onClick={fetchViewers} className="flex flex-col items-center">
                        <Eye size={24} />
                        <span className="text-xs font-bold">{viewers ? viewers.length : 'Visto por...'}</span>
                    </button>
                )}
            </div>
            
            {/* Viewers List Sheet */}
            {viewers && (
                <div className="absolute bottom-0 w-full bg-white rounded-t-3xl h-[40%] text-black z-30 animate-in slide-in-from-bottom p-4">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold">Visualizado por {viewers.length}</h3>
                         <button onClick={() => setViewers(null)}><X size={20}/></button>
                    </div>
                    <ul className="overflow-y-auto h-full pb-8">
                        {viewers.map((v, idx) => (
                            <li key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100">
                                <img src={v.photo} className="w-10 h-10 rounded-full" />
                                <span className="font-bold">{v.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default StatusPage;