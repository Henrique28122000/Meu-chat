
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Status, User, Viewer, StatusGroup, formatTimeSP } from '../types';
import { Plus, X, Camera, Video, Trash2, Eye, Send } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';

interface StatusPageProps {
  currentUser: User;
}

const StatusPage: React.FC<StatusPageProps> = ({ currentUser }) => {
  const [groupedStatuses, setGroupedStatuses] = useState<StatusGroup[]>([]);
  
  // Viewer State
  const [viewingGroupIndex, setViewingGroupIndex] = useState<number | null>(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState<Viewer[] | null>(null);
  
  // Creator State
  const [showCreator, setShowCreator] = useState(false);
  const [file, setFile] = useState<File | Blob | null>(null);
  const [type, setType] = useState<'image' | 'video' | 'audio' | 'text'>('image');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchStatuses = async () => {
      try {
          const data = await api.getStatuses(currentUser.id);
          
          if(Array.isArray(data)) {
              // Group by User
              const groups: {[key: string]: StatusGroup} = {};
              
              data.forEach(st => {
                  if(!groups[st.user_id]) {
                      groups[st.user_id] = {
                          user_id: st.user_id,
                          user_name: st.user_id === currentUser.id ? 'Meu Status' : st.name,
                          user_photo: st.photo,
                          statuses: [],
                          hasUnviewed: false
                      };
                  }
                  groups[st.user_id].statuses.push(st);
                  if(st.user_id !== currentUser.id && !st.viewed_by_me) {
                      groups[st.user_id].hasUnviewed = true;
                  }
              });

              // Convert to array, put "Me" first
              let groupArray = Object.values(groups);
              const myGroup = groupArray.find(g => g.user_id === currentUser.id);
              const others = groupArray.filter(g => g.user_id !== currentUser.id);
              
              // Sort others: Unviewed first, then alphabetical
              others.sort((a, b) => {
                  if (a.hasUnviewed && !b.hasUnviewed) return -1;
                  if (!a.hasUnviewed && b.hasUnviewed) return 1;
                  return 0;
              });

              setGroupedStatuses(myGroup ? [myGroup, ...others] : others);
          }
      } catch(e) { console.error(e) }
  }

  useEffect(() => {
      fetchStatuses();
  }, [currentUser.id]);

  // --- POSTING LOGIC (IGUAL DISCOVER PAGE) ---
  const handlePost = async () => {
      if(type !== 'text' && !file) {
          alert("Selecione um arquivo para postar.");
          return;
      }
      if(type === 'text' && !caption.trim()) {
          alert("Escreva algo para postar.");
          return;
      }

      setUploading(true);
      try {
          let mediaUrl = '';
          
          if (file) {
             if (type === 'image') {
                 const res = await api.uploadPhoto(file as File, currentUser.id);
                 if(res.file_url) mediaUrl = res.file_url;
             } else if (type === 'video') {
                 const res = await api.uploadVideo(file as File, currentUser.id);
                 if(res.file_url) mediaUrl = res.file_url;
             } else if (type === 'audio') {
                 const res = await api.uploadAudio(file as Blob, currentUser.id);
                 // O audio geralmente retorna path relativo ou absoluto dependendo da api
                 if(res.file_path) mediaUrl = `https://paulohenriquedev.site/api/${res.file_path}`; 
                 else if (res.file_url) mediaUrl = res.file_url;
             }
          }

          // Se for midia e falhou o upload
          if (type !== 'text' && !mediaUrl) {
              throw new Error("Falha no upload da mídia");
          }

          await api.postStatus(currentUser.id, mediaUrl, type, caption);
          
          // Sucesso
          setShowCreator(false);
          setFile(null); 
          setPreview(null); 
          setCaption('');
          await fetchStatuses(); 

      } catch(e) {
          alert("Erro ao postar status. Tente novamente.");
          console.error(e);
      } finally {
          setUploading(false);
      }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, t: 'image' | 'video') => {
      if(e.target.files && e.target.files[0]){
          const f = e.target.files[0];
          setFile(f);
          setType(t);
          setPreview(URL.createObjectURL(f));
      }
  }

  // --- VIEWER LOGIC ---
  useEffect(() => {
      let timer: any;
      if (viewingGroupIndex !== null) {
          const group = groupedStatuses[viewingGroupIndex];
          if(!group || !group.statuses[currentStatusIndex]) {
              closeViewer();
              return;
          }

          const currentStatus = group.statuses[currentStatusIndex];
          
          // Mark as viewed
          if(currentStatus.user_id !== currentUser.id) {
             api.viewStatus(currentStatus.id, currentUser.id).catch(() => {});
          }

          setProgress(0);
          
          // Auto advance timer
          const duration = currentStatus.media_type === 'video' ? 15000 : 5000; 
          const step = 100 / (duration / 100);

          timer = setInterval(() => {
              setProgress(old => {
                  if (old >= 100) {
                      clearInterval(timer);
                      nextStatus();
                      return 100;
                  }
                  return old + step;
              });
          }, 100);
      }
      return () => clearInterval(timer);
  }, [viewingGroupIndex, currentStatusIndex]);

  const nextStatus = () => {
      if(viewingGroupIndex === null) return;
      const group = groupedStatuses[viewingGroupIndex];
      
      if (currentStatusIndex < group.statuses.length - 1) {
          setCurrentStatusIndex(prev => prev + 1);
          setProgress(0);
      } else {
          // Next User Group
          if (viewingGroupIndex < groupedStatuses.length - 1) {
              setViewingGroupIndex(prev => (prev !== null ? prev + 1 : null));
              setCurrentStatusIndex(0);
              setProgress(0);
          } else {
              closeViewer();
          }
      }
  };

  const prevStatus = () => {
      if (currentStatusIndex > 0) {
          setCurrentStatusIndex(prev => prev - 1);
          setProgress(0);
      } else {
           // Previous User Group
           if(viewingGroupIndex !== null && viewingGroupIndex > 0) {
               setViewingGroupIndex(prev => (prev !== null ? prev - 1 : null));
               setCurrentStatusIndex(0); 
           } else {
               closeViewer();
           }
      }
  };

  const closeViewer = () => {
      setViewingGroupIndex(null);
      setCurrentStatusIndex(0);
      setProgress(0);
      setViewers(null);
  };

  const deleteCurrentStatus = async () => {
      if(viewingGroupIndex === null) return;
      const group = groupedStatuses[viewingGroupIndex];
      const status = group.statuses[currentStatusIndex];

      if(confirm("Excluir este status?")) {
          // Call API
          await api.deleteStatus(status.id, currentUser.id);
          
          // Update Local State IMMUTABLY to force re-render
          const newGroups = [...groupedStatuses];
          const groupIndex = viewingGroupIndex; 
          
          // Remove status from the group
          newGroups[groupIndex] = {
              ...newGroups[groupIndex],
              statuses: newGroups[groupIndex].statuses.filter(s => s.id !== status.id)
          };

          // If group is empty, remove group
          if(newGroups[groupIndex].statuses.length === 0) {
              newGroups.splice(groupIndex, 1);
              setGroupedStatuses(newGroups);
              closeViewer();
          } else {
              setGroupedStatuses(newGroups);
              // Navigate
              if(currentStatusIndex >= newGroups[groupIndex].statuses.length) {
                  // Was last item, go back or close if handled above
                  setCurrentStatusIndex(Math.max(0, newGroups[groupIndex].statuses.length - 1));
              } 
              // If not last, index stays same (next item shifts into place)
              setProgress(0);
          }
      }
  }

  const loadViewers = async () => {
      if(viewingGroupIndex === null) return;
      const status = groupedStatuses[viewingGroupIndex].statuses[currentStatusIndex];
      const v = await api.getStatusViewers(status.id);
      setViewers(v);
  }

  // --- RENDER ---
  const activeGroup = viewingGroupIndex !== null ? groupedStatuses[viewingGroupIndex] : null;
  const activeStatus = activeGroup ? activeGroup.statuses[currentStatusIndex] : null;

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      <header className="px-5 py-4 bg-[#008069] text-white shadow-sm z-10 sticky top-0 flex justify-between items-center">
          <h1 className="text-xl font-bold">Status</h1>
          <button onClick={() => setShowCreator(true)} className="p-1 rounded-full hover:bg-white/10 transition">
              <Camera size={22} />
          </button>
      </header>

      <div className="flex-1 overflow-y-auto">
           {/* My Status Row */}
           <div className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
               const myGroupIndex = groupedStatuses.findIndex(g => g.user_id === currentUser.id);
               if(myGroupIndex !== -1) {
                   setViewingGroupIndex(myGroupIndex);
                   setCurrentStatusIndex(0);
               } else {
                   setShowCreator(true);
               }
           }}>
               <div className="relative">
                   <img src={currentUser.photo} className="w-14 h-14 rounded-full object-cover" />
                   <div className="absolute bottom-0 right-0 bg-[#008069] rounded-full p-0.5 border-2 border-white">
                       <Plus size={14} className="text-white"/>
                   </div>
               </div>
               <div className="flex-1 border-b border-gray-100 pb-4 pt-2">
                   <h3 className="font-bold text-gray-900">Meu Status</h3>
                   <p className="text-xs text-gray-500">Toque para adicionar ou ver</p>
               </div>
           </div>

           <h2 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Atualizações recentes</h2>

           {/* Other Users Rows */}
           {groupedStatuses.filter(g => g.user_id !== currentUser.id).map((group, idx) => {
               const originalIndex = groupedStatuses.findIndex(g => g.user_id === group.user_id);
               const lastStatus = group.statuses[group.statuses.length - 1];

               return (
                   <div key={group.user_id} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                       setViewingGroupIndex(originalIndex);
                       setCurrentStatusIndex(0);
                   }}>
                       <div className={`p-[2px] rounded-full border-2 ${group.hasUnviewed ? 'border-[#008069]' : 'border-gray-300'}`}>
                           <img src={group.user_photo} className="w-12 h-12 rounded-full object-cover" />
                       </div>
                       <div className="flex-1 border-b border-gray-100 pb-4 pt-2">
                           <h3 className="font-bold text-gray-900">{group.user_name}</h3>
                           <p className="text-xs text-gray-500">
                               {formatTimeSP(lastStatus.timestamp)}
                           </p>
                       </div>
                   </div>
               )
           })}
      </div>

      {/* --- CREATOR MODAL --- */}
      {showCreator && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-bottom">
              <div className="flex justify-between p-4 bg-black/50 absolute top-0 w-full z-10 text-white">
                  <button onClick={() => setShowCreator(false)}><X /></button>
                  <span className="font-bold">Novo Status</span>
                  <button onClick={handlePost} disabled={uploading} className="bg-[#008069] px-4 py-1 rounded-full text-sm font-bold disabled:opacity-50">
                      {uploading ? 'Enviando...' : <Send size={18} />}
                  </button>
              </div>
              <div className="flex-1 bg-black flex flex-col items-center justify-center relative">
                  {!file && type !== 'text' ? (
                      <div className="flex gap-8">
                          <label onClick={() => setType('image')} className="flex flex-col items-center text-white gap-2 cursor-pointer">
                              <div className="w-16 h-16 rounded-full border border-white flex items-center justify-center hover:bg-white/10 transition"><Camera size={32}/></div>
                              <span className="text-xs font-bold">Foto</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')} />
                          </label>
                          <label onClick={() => setType('video')} className="flex flex-col items-center text-white gap-2 cursor-pointer">
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
                        {type !== 'text' && <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-16 right-4 bg-black/50 text-white p-2 rounded-full"><X/></button>}
                      </>
                  )}
                  
                  {type === 'text' && (
                      <div className="w-full h-full flex items-center justify-center bg-teal-900 p-8">
                          <textarea 
                              value={caption}
                              onChange={e => setCaption(e.target.value)}
                              placeholder="Digite seu status..."
                              className="w-full bg-transparent text-white text-3xl font-bold text-center outline-none resize-none placeholder-white/50"
                              autoFocus
                          />
                      </div>
                  )}
              </div>
              
              {type !== 'text' && (
                  <div className="p-4 bg-black relative z-10">
                      <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Adicionar legenda..." className="w-full bg-gray-800 text-white p-3 rounded-full outline-none text-center" />
                  </div>
              )}
          </div>
      )}

       {/* --- VIEWER OVERLAY --- */}
      {activeGroup && activeStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Progress Bars */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                {activeGroup.statuses.map((st, i) => (
                    <div key={st.id} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-100 linear"
                            style={{ 
                                width: i < currentStatusIndex ? '100%' : (i === currentStatusIndex ? `${progress}%` : '0%')
                            }} 
                        ></div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between p-4 pt-6 text-white z-10">
                <div className="flex items-center gap-3">
                    <img src={activeGroup.user_photo} className="w-10 h-10 rounded-full border border-white/50" />
                    <div>
                        <h4 className="font-bold text-sm">{activeGroup.user_name}</h4>
                        <span className="text-xs text-gray-300">{formatTimeSP(activeStatus.timestamp)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {activeGroup.user_id === currentUser.id && (
                        <button onClick={deleteCurrentStatus} className="p-2"><Trash2 size={24} /></button>
                    )}
                    <button onClick={closeViewer}><X size={28} /></button>
                </div>
            </div>

            {/* Click Zones for Navigation */}
            <div className="absolute inset-0 flex z-0">
                <div className="w-1/3 h-full" onClick={prevStatus}></div>
                <div className="w-1/3 h-full"></div> 
                <div className="w-1/3 h-full" onClick={nextStatus}></div>
            </div>

            <div className="flex-1 flex items-center justify-center relative bg-gray-900 pointer-events-none">
                 {activeStatus.media_type === 'image' && <img src={activeStatus.media_url} className="max-w-full max-h-full" />}
                 {activeStatus.media_type === 'video' && <video src={activeStatus.media_url} autoPlay className="max-w-full max-h-full" />}
                 {activeStatus.media_type === 'audio' && <div className="p-10 bg-white/10 rounded-3xl backdrop-blur pointer-events-auto"><AudioMessage src={activeStatus.media_url} isMe={false} /></div>}
                 {activeStatus.media_type === 'text' && <div className="w-full h-full bg-teal-900 flex items-center justify-center p-8 text-center"><p className="text-2xl font-bold text-white">{activeStatus.caption}</p></div>}
            </div>
            
            <div className="absolute bottom-10 w-full flex flex-col items-center text-white z-20 pb-4 pointer-events-auto">
                {activeStatus.caption && activeStatus.media_type !== 'text' && <p className="text-lg bg-black/30 p-2 rounded mb-4 max-w-[80%] text-center">{activeStatus.caption}</p>}
                
                {activeGroup.user_id === currentUser.id && (
                    <button onClick={loadViewers} className="flex flex-col items-center mt-2">
                        <Eye size={24} />
                        <span className="text-xs font-bold mt-1">
                            {viewers ? viewers.length : (activeStatus.viewers_count || 0)} views
                        </span>
                    </button>
                )}
            </div>

            {/* Viewers Sheet */}
            {viewers && (
                <div className="absolute bottom-0 w-full bg-white rounded-t-3xl h-[50%] text-black z-30 animate-in slide-in-from-bottom p-4">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg">Visualizado por {viewers.length}</h3>
                         <button onClick={() => setViewers(null)}><X size={24}/></button>
                    </div>
                    <ul className="overflow-y-auto h-full pb-10">
                        {viewers.map((v, idx) => (
                            <li key={idx} className="flex items-center gap-3 py-3 border-b border-gray-100">
                                <img src={v.photo} className="w-12 h-12 rounded-full bg-gray-200" />
                                <span className="font-bold text-gray-800">{v.name}</span>
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
