
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Post, User } from '../types';
import PostCard from '../components/PostCard';
import { Plus, Image as ImageIcon, Video, X, Camera } from 'lucide-react';

interface DiscoverPageProps {
  currentUser: User;
}

const DiscoverPage: React.FC<DiscoverPageProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'text'>('all');
  
  // Creation State
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [postFile, setPostFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
             }
          }

          // @ts-ignore
          await api.createPost(currentUser.id, postText, mediaUrl, postType);
          fetchFeed();
          resetPost();

      } catch (err) {
          alert('Erro ao publicar');
      } finally {
          setUploading(false);
      }
  }

  const filteredPosts = posts.filter(post => {
      if (filter === 'all') return true;
      return post.media_type === filter;
  });

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 pb-20">
      <header className="gradient-bg pt-4 pb-2 text-white shadow-md z-10 sticky top-0 rounded-b-xl">
          <h1 className="text-xl font-bold px-5 mb-3">Descobrir</h1>
          
          {/* Filters Bar */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
              {[
                  { id: 'all', label: 'Tudo' },
                  { id: 'image', label: 'Fotos' },
                  { id: 'video', label: 'Vídeos' },
                  { id: 'audio', label: 'Áudios' },
                  { id: 'text', label: 'Texto' },
              ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                        filter === f.id ? 'bg-white text-[#008069]' : 'bg-[#006e5a] text-white/80 hover:bg-white/10'
                    }`}
                  >
                      {f.label}
                  </button>
              ))}
          </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
           {loading ? (
               <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#008069] border-t-transparent rounded-full animate-spin"></div></div>
           ) : (
               filteredPosts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)
           )}
           {!loading && filteredPosts.length === 0 && (
               <p className="text-center text-gray-400 mt-10">Nenhum post encontrado nesta categoria.</p>
           )}
      </div>

      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#008069] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#006e5a] transition-all z-40 active:scale-90"
      >
          <Plus size={28} />
      </button>

      {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in slide-in-from-bottom">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md h-[80%] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl transition-colors">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                      <button onClick={resetPost}><X size={24} className="text-gray-400" /></button>
                      <h3 className="font-bold text-gray-800 dark:text-gray-200">Nova Publicação</h3>
                      <button onClick={handlePublish} disabled={uploading} className="font-bold text-[#008069] disabled:opacity-50">
                          {uploading ? '...' : 'Postar'}
                      </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                      <textarea 
                          className="w-full h-32 resize-none outline-none text-lg text-gray-700 dark:text-gray-200 bg-transparent placeholder-gray-300 dark:placeholder-gray-600" 
                          placeholder="No que você está pensando?"
                          value={postText}
                          onChange={e => setPostText(e.target.value)}
                      ></textarea>

                      {previewUrl && (
                          <div className="mt-4 relative rounded-xl overflow-hidden bg-black max-h-60 flex justify-center">
                              {postType === 'image' && <img src={previewUrl} className="max-h-60 object-contain" />}
                              {postType === 'video' && <video src={previewUrl} controls className="max-h-60" />}
                              <button onClick={() => { setPostFile(null); setPreviewUrl(null); setPostType('text'); }} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
                          </div>
                      )}
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                      <div className="flex justify-between items-center gap-2">
                          <label className="flex-1 flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                              <ImageIcon className="text-[#008069] mb-1" />
                              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Foto</span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
                          </label>
                          <label className="flex-1 flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                              <Video className="text-[#008069] mb-1" />
                              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Vídeo</span>
                              <input type="file" accept="video/*" className="hidden" onChange={e => handleFileSelect(e, 'video')} />
                          </label>
                          <label className="flex-1 flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                              <Camera className="text-[#008069] mb-1" />
                              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Câmera</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
                          </label>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DiscoverPage;