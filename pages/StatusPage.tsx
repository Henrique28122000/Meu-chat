
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { User, Viewer, StatusGroup, formatTimeSP } from '../types';
import { Plus, X, Camera, Trash2, Eye, Send, Video, Mic, Type, Image as ImageIcon } from 'lucide-react';
import AudioMessage from '../components/AudioMessage';
import AudioRecorder from '../components/AudioRecorder';

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
  const [creatorMode, setCreatorMode] = useState<'text' | 'camera' | 'video' | 'audio'>('text');
  
  const [file, setFile] = useState<File | Blob | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Video Ref for Viewer
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchStatuses = async () => {
      try {
          const data = await api.getStatuses(currentUser.id);
          
          if(Array.isArray(data)) {
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

              let groupArray = Object.values(groups);
              const myGroup = groupArray.find(g => g.user_id === currentUser.id);
              const others = groupArray.filter(g => g.user_id !== currentUser.id);
              
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

  const handlePost = async () => {
      if(creatorMode !== 'text' && !file) {
          alert("Conteúdo vazio.");
          return;
      }
      if(creatorMode === 'text' && !caption.trim()) {
          alert("Digite algum texto.");
          return;
      }

      setUploading(true);

      try {
          let mediaUrl = '';
          let mediaType = creatorMode === 'camera' ? 'image' : creatorMode; 
          
          // Upload logic based on type
          if (file) {
             try {
                 let res: any;
                 
                 if (creatorMode === 'camera') {
                     res = await api.uploadPhoto(file as File, currentUser.id);
                 } else if (creatorMode === 'video') {
                     res = await api.uploadVideo(file as File, currentUser.id);
                 } else if (creatorMode === 'audio') {
                     res = await api.uploadAudio(file as Blob, currentUser.id);
                 }

                 if(res.file_url) {
                     mediaUrl = res.file_url;
                 } else if (res.file_path) {
                     mediaUrl = `https://paulohenriquedev.site/api/${res.file_path}`;
                 } else {
                     throw new Error("Servidor não retornou URL.");
                 }
             } catch (uploadError: any) {
                 alert("Erro no upload: " + (uploadError.message || "Tente novamente."));
                 setUploading(false);
                 return;
             }
          }

          const response = await api.postStatus(currentUser.id, mediaUrl, mediaType, caption);
          
          if(response && response.status === 'success') {
              setShowCreator(false);
              setFile(null); setPreview(null); setCaption(''); setCreatorMode('text');
              await fetchStatuses(); 
          } else {
              alert(response.message || "Erro ao salvar status.");
          }

      } catch(e: any) {
          alert("Erro: " + (e.message || "Erro de conexão"));
      } finally {
          setUploading(false);
      }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'camera' | 'video') => {
      if(e.target.files && e.target.files[0]){
          const f = e.target.files[0];
          setFile(f);
          setCreatorMode(mode);
          setPreview(URL.createObjectURL(f));
      }
  }

  const handleAudioRecorded = (blob: Blob) => {
      setFile(blob);
      setCreatorMode('audio');
      setPreview(URL.createObjectURL(blob));
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
          
          if(currentStatus.user_id !== currentUser.id && !currentStatus.viewed_by_me) {
             api.viewStatus(currentStatus.id, currentUser.id).catch(() => {});
             currentStatus.viewed_by_me = true; 
          }

          setProgress(0);
          
          let duration = 5000; 
          if (currentStatus.media_type === 'video' && videoRef.current) return; 
          if (currentStatus.media_type === 'audio') return; 

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
          await api.deleteStatus(status.id, currentUser.id);
          const newGroups = [...groupedStatuses];
          const groupIndex = viewingGroupIndex; 
          
          newGroups[groupIndex] = {
              ...newGroups[groupIndex],
              statuses: newGroups[groupIndex].statuses.filter(s => s.id !== status.id)
          };

          if(newGroups[groupIndex].statuses.length === 0) {
              newGroups.splice(groupIndex, 1);
              setGroupedStatuses(newGroups);
              closeViewer();
          } else {
              setGroupedStatuses(newGroups);
              if(currentStatusIndex >= newGroups[groupIndex].statuses.length) {
                  setCurrentStatusIndex(Math.max(0, newGroups[groupIndex].statuses.length - 1));
              } 
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

  const activeGroup = viewingGroupIndex !== null ? groupedStatuses[viewingGroupIndex] : null;
  const activeStatus = activeGroup ? activeGroup.statuses[currentStatusIndex] : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-20">
      <header className="px-5 py-4 gradient-bg text-white shadow-sm z-10 sticky top-0 flex justify-between items-center">
          <h1 className="text-xl font-bold">Stories</h1>
          <button onClick={() => setShowCreator(true)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
              <Camera size={20} />
          </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
           <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
               <div className="min-w-[100px] h-[160px] relative rounded-xl overflow-hidden cursor-pointer shadow-md group border border-gray-100 dark:border-gray-800" 
                    onClick={() => {
                       const myGroupIndex = groupedStatuses.findIndex(g => g.user_id === currentUser.id);
                       if(myGroupIndex !== -1) {
                           setViewingGroupIndex(myGroupIndex);
                           setCurrentStatusIndex(0);
                       } else {
                           setShowCreator(true);
                       }
                    }}>
                   <img src={currentUser.photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition"></div>
                   <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                       <p className="text-white text-xs font-bold truncate">Meu Story</p>
                   </div>
                   <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow">
                       <Plus size={16} className="text-[#008069]" />
                   </div>
               </div>

               {groupedStatuses.filter(g => g.user_id !== currentUser.id).map((group, idx) => {
                   const originalIndex = groupedStatuses.findIndex(g => g.user_id === group.user_id);
                   const lastStatus = group.statuses[group.statuses.length - 1];
                   
                   let previewImg = group.user_photo; 
                   if(lastStatus.media_type === 'image') previewImg = lastStatus.media_url;
                   
                   return (
                       <div key={group.user_id} className={`min-w-[100px] h-[160px] relative rounded-xl overflow-hidden cursor-pointer shadow-md group border-2 ${group.hasUnviewed ? 'border-[#008069]' : 'border-gray-100 dark:border-gray-700'}`}
                            onClick={() => {
                               setViewingGroupIndex(originalIndex);
                               setCurrentStatusIndex(0);
                            }}>
                           <img src={previewImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                           <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition"></div>
                           <div className="absolute top-2 left-2 p-0.5 rounded-full bg-[#008069] border border-white">
                               <img src={group.user_photo} className="w-6 h-6 rounded-full" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                               <p className="text-white text-xs font-bold truncate">{group.user_name}</p>
                           </div>
                       </div>
                   )
               })}
           </div>

           <div className="mt-4">
               <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2">Atualizações</h3>
               {groupedStatuses.length <= 1 && <p className="text-gray-400 text-sm">Nenhum status recente dos seus amigos.</p>}
           </div>
      </div>

      {showCreator && (
          <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col animate-in slide-in-from-bottom">
              <div className="flex justify-between items-center p-4 bg-black/40 text-white z-20">
                  <button onClick={() => setShowCreator(false)}><X size={24}/></button>
                  <span className="font-bold text-lg">Criar Status</span>
                  <button onClick={handlePost} disabled={uploading} className="bg-[#008069] w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg">
                      {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send size={20} className="-rotate-12 mr-0.5 mt-0.5" />}
                  </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-900 overflow-hidden">
                  
                  {creatorMode === 'text' && (
                      <textarea 
                          value={caption}
                          onChange={e => setCaption(e.target.value)}
                          placeholder="Digite seu status..."
                          className="w-full h-full bg-teal-900 text-white text-3xl font-bold text-center outline-none resize-none pt-[40vh] px-8 placeholder-teal-700/50"
                          autoFocus
                      />
                  )}

                  {creatorMode === 'audio' && !file && (
                      <div className="flex flex-col items-center justify-center h-full">
                          <h3 className="text-white mb-6 font-bold text-xl">Gravar Áudio</h3>
                          <div className="scale-150">
                              <AudioRecorder onSend={handleAudioRecorded} />
                          </div>
                      </div>
                  )}

                  {file && (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                          {creatorMode === 'camera' && <img src={preview!} className="max-w-full max-h-full object-contain" />}
                          {creatorMode === 'video' && <video src={preview!} controls className="max-w-full max-h-full" />}
                          {creatorMode === 'audio' && (
                              <div className="p-8 bg-teal-800 rounded-3xl flex flex-col items-center animate-pulse">
                                  <Mic size={48} className="text-white mb-4" />
                                  <audio src={preview!} controls />
                              </div>
                          )}
                          <button onClick={() => { setFile(null); setPreview(null); setCreatorMode('text'); }} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white z-20 hover:bg-red-500/80 transition"><Trash2 size={20}/></button>
                      </div>
                  )}
              </div>

              {!file && (
                  <div className="bg-black p-6 pb-8">
                      <div className="flex justify-around items-center">
                          <button onClick={() => setCreatorMode('text')} className={`flex flex-col items-center gap-1 ${creatorMode === 'text' ? 'text-teal-400' : 'text-gray-400'}`}>
                              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1"><Type size={20}/></div>
                              <span className="text-xs font-bold">Texto</span>
                          </button>

                          <label className={`flex flex-col items-center gap-1 cursor-pointer ${creatorMode === 'camera' ? 'text-teal-400' : 'text-gray-400'}`}>
                              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1"><Camera size={20}/></div>
                              <span className="text-xs font-bold">Foto</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'camera')} />
                          </label>

                          <label className={`flex flex-col items-center gap-1 cursor-pointer ${creatorMode === 'video' ? 'text-teal-400' : 'text-gray-400'}`}>
                              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1"><Video size={20}/></div>
                              <span className="text-xs font-bold">Vídeo</span>
                              <input type="file" accept="video/*" className="hidden" onChange={e => handleFileSelect(e, 'video')} />
                          </label>

                          <button onClick={() => setCreatorMode('audio')} className={`flex flex-col items-center gap-1 ${creatorMode === 'audio' ? 'text-teal-400' : 'text-gray-400'}`}>
                              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1"><Mic size={20}/></div>
                              <span className="text-xs font-bold">Áudio</span>
                          </button>
                      </div>
                  </div>
              )}

              {(creatorMode === 'camera' || creatorMode === 'video') && file && (
                  <div className="p-3 bg-black">
                      <input 
                        value={caption} 
                        onChange={e => setCaption(e.target.value)} 
                        placeholder="Adicionar legenda..." 
                        className="w-full bg-gray-800 text-white p-3 rounded-full outline-none text-center placeholder-gray-500" 
                      />
                  </div>
              )}
          </div>
      )}

      {activeGroup && activeStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
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

            <div className="absolute inset-0 flex z-0">
                <div className="w-1/3 h-full" onClick={prevStatus}></div>
                <div className="w-1/3 h-full"></div> 
                <div className="w-1/3 h-full" onClick={nextStatus}></div>
            </div>

            <div className="flex-1 flex items-center justify-center relative bg-gray-900 pointer-events-none">
                 {activeStatus.media_type === 'image' && <img src={activeStatus.media_url} className="max-w-full max-h-full object-contain" />}
                 
                 {activeStatus.media_type === 'video' && (
                     <video 
                        ref={videoRef}
                        src={activeStatus.media_url} 
                        className="max-w-full max-h-full pointer-events-auto" 
                        autoPlay 
                        playsInline
                        onEnded={() => { setProgress(100); setTimeout(nextStatus, 100); }}
                     />
                 )}
                 
                 {activeStatus.media_type === 'audio' && (
                     <div className="w-full px-10 pointer-events-auto bg-black/50 p-8 rounded-2xl backdrop-blur-md border border-white/10 flex flex-col items-center">
                         <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Mic size={40} className="text-white" />
                         </div>
                         <div className="w-full">
                            <AudioMessage src={activeStatus.media_url} isMe={false} />
                         </div>
                         <audio 
                            src={activeStatus.media_url}
                            autoPlay
                            onEnded={() => { setProgress(100); setTimeout(nextStatus, 100); }}
                            className="hidden"
                         />
                     </div>
                 )}
                 
                 {activeStatus.media_type === 'text' && (
                    <div className="w-full h-full bg-teal-900 flex items-center justify-center p-8 text-center break-words">
                        <p className="text-3xl font-bold text-white leading-relaxed">{activeStatus.caption}</p>
                    </div>
                 )}
            </div>
            
            <div className="absolute bottom-10 w-full flex flex-col items-center text-white z-20 pb-4 pointer-events-auto">
                {activeStatus.caption && activeStatus.media_type !== 'text' && <p className="text-lg bg-black/40 backdrop-blur-md p-3 rounded-xl mb-4 max-w-[85%] text-center">{activeStatus.caption}</p>}
                
                {activeGroup.user_id === currentUser.id && (
                    <button onClick={loadViewers} className="flex flex-col items-center mt-2 opacity-90 hover:opacity-100">
                        <Eye size={24} />
                        <span className="text-xs font-bold mt-1">
                            {viewers ? viewers.length : (activeStatus.viewers_count || 0)} views
                        </span>
                    </button>
                )}
            </div>

            {viewers && (
                <div className="absolute bottom-0 w-full bg-white dark:bg-gray-800 rounded-t-3xl h-[50%] text-black dark:text-white z-30 animate-in slide-in-from-bottom p-4 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg">Visualizado por {viewers.length}</h3>
                         <button onClick={() => setViewers(null)}><X size={24}/></button>
                    </div>
                    <ul className="overflow-y-auto h-full pb-10 space-y-2">
                        {viewers.map((v, idx) => (
                            <li key={idx} className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                                <img src={v.photo} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{v.name}</span>
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
