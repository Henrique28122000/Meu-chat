
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Post, User } from '../types';
import PostCard from '../components/PostCard';
import AudioRecorder from '../components/AudioRecorder';
import { Plus, Image as ImageIcon, Video, Mic, Type, X, Send } from 'lucide-react';

interface DiscoverPageProps {
  currentUser: User;
}

const DiscoverPage: React.FC<DiscoverPageProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Creation State
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [postFile, setPostFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchFeed = async () => {
    try {
      const data = await api.getPosts(currentUser.id);
      if (Array.isArray(data)) setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentUser.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setPostFile(file);
          setPostType(type);
          setPreviewUrl(URL.createObjectURL(file));
      }
  }

  const handleAudioRecord = (blob: Blob) => {
      setPostFile(blob);
      setPostType('audio');
      setPreviewUrl(URL.createObjectURL(blob));
  }

  const resetPost = () => {
      setShowCreateModal(false);
      setPostText('');
      setPostFile(null);
      setPreviewUrl(null);
      setPostType('text');
  }

  const handlePublish = async () => {
      setUploading(true);
      try {
          let mediaUrl = '';
          
          if (postFile) {
             if (postType === 'image') {
                 const res = await api.uploadPhoto(postFile as File, currentUser.id);
                 if(res.file_url) mediaUrl = res.file_url;
             } else if (postType === 'video') {
                 const res = await api.uploadVideo(postFile as File, currentUser.id);
                 if(res.file_url) mediaUrl = res.file_url;
             } else if (postType === 'audio') {
                 const res = await api.uploadAudio(postFile as Blob, currentUser.id);
                 if(res.file_path) mediaUrl = `https://paulohenriquedev.site/api/${res.file_path}`;
             }
          }

          await api.createPost(currentUser.id, postText, mediaUrl, postType);
          fetchFeed();
          resetPost();

      } catch (err) {
          alert('Erro ao publicar');
      } finally {
          setUploading(false);
      }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <header className="px-6 py-5 bg-white shadow-sm z-10 sticky top-0 rounded-b-3xl">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-700">Descobrir</h1>
          <p className="text-xs text-gray-400 font-medium">O que está acontecendo agora</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
           {loading ? (
               <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
           ) : (
               posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)
           )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl shadow-xl shadow-teal-500/30 flex items-center justify-center hover:scale-105 transition-all z-40"
      >
          <Plus size={28} />
      </button>

      {/* Create Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white w-full max-w-md h-[80%] sm:h-auto sm:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                      <button onClick={resetPost}><X size={24} className="text-gray-400" /></button>
                      <h3 className="font-bold text-gray-800">Nova Publicação</h3>
                      <button onClick={handlePublish} disabled={uploading} className="font-bold text-teal-600 disabled:opacity-50">
                          {uploading ? '...' : 'Postar'}
                      </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                      <textarea 
                          className="w-full h-32 resize-none outline-none text-lg text-gray-700 placeholder-gray-300" 
                          placeholder="No que você está pensando?"
                          value={postText}
                          onChange={e => setPostText(e.target.value)}
                      ></textarea>

                      {/* Preview */}
                      {previewUrl && (
                          <div className="mt-4 relative rounded-xl overflow-hidden bg-black max-h-60 flex justify-center">
                              {postType === 'image' && <img src={previewUrl} className="max-h-60 object-contain" />}
                              {postType === 'video' && <video src={previewUrl} controls className="max-h-60" />}
                              {postType === 'audio' && <audio src={previewUrl} controls className="w-full mt-10" />}
                              <button onClick={() => { setPostFile(null); setPreviewUrl(null); setPostType('text'); }} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
                          </div>
                      )}
                  </div>

                  {/* Tools */}
                  <div className="p-4 bg-gray-50 rounded-b-3xl">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-3">Adicionar à postagem</p>
                      <div className="flex justify-between items-center gap-2">
                          <label className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-teal-50 transition">
                              <ImageIcon className="text-blue-500 mb-1" />
                              <span className="text-[10px] font-bold text-gray-600">Foto</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
                          </label>
                          <label className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-teal-50 transition">
                              <Video className="text-purple-500 mb-1" />
                              <span className="text-[10px] font-bold text-gray-600">Vídeo</span>
                              <input type="file" accept="video/*" className="hidden" onChange={e => handleFileSelect(e, 'video')} />
                          </label>
                          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-teal-50 transition relative overflow-hidden">
                              <div className="scale-75 origin-center">
                                  <AudioRecorder onSend={handleAudioRecord} />
                              </div>
                              <span className="text-[10px] font-bold text-gray-600 mt-1">Áudio</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DiscoverPage;
