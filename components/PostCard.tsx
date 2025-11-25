
import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Play, Trash2, Send } from 'lucide-react';
import { Post, User, formatTimeSP, Comment } from '../types';
import { api } from '../services/api';
import AudioMessage from './AudioMessage';

interface PostCardProps {
  post: Post;
  currentUser: User;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser }) => {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [deleted, setDeleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Comments Logic
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      await api.likePost(currentUser.id, post.id);
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
    }
  };

  const toggleComments = async () => {
      setShowComments(!showComments);
      if(!showComments && comments.length === 0) {
          setLoadingComments(true);
          try {
              const data = await api.getComments(post.id);
              if(Array.isArray(data)) setComments(data);
          } catch(e) {}
          setLoadingComments(false);
      }
  }

  const sendComment = async () => {
      if(!newComment.trim()) return;
      try {
          await api.commentPost(currentUser.id, post.id, newComment);
          setNewComment('');
          setCommentsCount(prev => prev + 1);
          // Optimistic update
          setComments([...comments, {
              id: Math.random().toString(),
              user_id: currentUser.id,
              name: currentUser.name,
              photo: currentUser.photo,
              content: newComment,
              timestamp: new Date().toISOString()
          }]);
      } catch(e) {}
  }

  const toggleVideo = () => {
      if(videoRef.current) {
          if(isPlaying) videoRef.current.pause();
          else videoRef.current.play();
          setIsPlaying(!isPlaying);
      }
  }

  const handleDelete = async () => {
      if(confirm("Apagar postagem?")) {
          await api.deletePost(post.id, currentUser.id);
          setDeleted(true);
      }
  }

  if(deleted) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
            <img 
                src={post.photo || "https://picsum.photos/40/40"} 
                className="w-8 h-8 rounded-full object-cover mr-2 bg-gray-200" 
            />
            <div>
                <h3 className="font-bold text-sm text-gray-900">{post.name}</h3>
                <span className="text-[10px] text-gray-400">{formatTimeSP(post.timestamp)}</span>
            </div>
        </div>
        {post.user_id === currentUser.id && (
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
        )}
      </div>

      <div className="px-3 pb-2">
        {post.content && <p className="text-gray-800 text-sm mb-2 whitespace-pre-wrap">{post.content}</p>}
      </div>

      {post.media_type === 'image' && post.media_url && (
        <img src={post.media_url} className="w-full h-auto max-h-[400px] object-cover bg-gray-100" />
      )}

      {post.media_type === 'video' && post.media_url && (
        <div className="w-full bg-black relative group cursor-pointer" onClick={toggleVideo}>
            <video 
                ref={videoRef}
                src={post.media_url} 
                className="w-full h-auto max-h-[400px]" 
                loop 
                playsInline
                onEnded={() => setIsPlaying(false)}
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-white/30 backdrop-blur-sm p-4 rounded-full">
                        <Play fill="white" className="text-white" size={32} />
                    </div>
                </div>
            )}
        </div>
      )}

      {post.media_type === 'audio' && post.media_url && (
         <div className="px-3 pb-3">
             <div className="bg-gray-100 rounded-lg p-2">
                 <AudioMessage src={post.media_url} isMe={false} />
             </div>
         </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 mt-1 border-t border-gray-50">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-semibold">{likesCount}</span>
          </button>

          <button onClick={toggleComments} className="flex items-center space-x-1 text-gray-500 hover:text-[#008069]">
            <MessageSquare size={20} />
            <span className="text-sm font-semibold">{commentsCount}</span>
          </button>
        </div>
      </div>

      {showComments && (
          <div className="bg-gray-50 p-3 border-t border-gray-100 animate-in slide-in-from-top-2">
              <div className="flex gap-2 mb-3">
                  <input 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:border-[#008069]"
                  />
                  <button onClick={sendComment} disabled={!newComment.trim()} className="p-2 bg-[#008069] text-white rounded-full disabled:opacity-50">
                      <Send size={16} />
                  </button>
              </div>
              
              <div className="space-y-3 max-h-40 overflow-y-auto">
                  {loadingComments ? <p className="text-xs text-center text-gray-400">Carregando...</p> : 
                   comments.map((c, i) => (
                      <div key={i} className="flex gap-2">
                          <img src={c.photo || "https://picsum.photos/30/30"} className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="flex-1 bg-white p-2 rounded-r-xl rounded-bl-xl text-sm shadow-sm">
                              <span className="font-bold text-xs block text-gray-900">{c.name}</span>
                              <p className="text-gray-700">{c.content}</p>
                          </div>
                      </div>
                   ))
                  }
              </div>
          </div>
      )}
    </div>
  );
};

export default PostCard;
