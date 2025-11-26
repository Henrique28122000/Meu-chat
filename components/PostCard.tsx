
import React, { useState } from 'react';
import { Heart, MessageSquare, Play, Trash2, Send, UserPlus, UserCheck, CornerDownRight } from 'lucide-react';
import { Post, User, formatTimeSP, Comment } from '../types';
import { api } from '../services/api';
import AudioMessage from './AudioMessage';
import { Link } from 'react-router-dom';

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
  
  // Follow State
  const [isFollowing, setIsFollowing] = useState(post.is_following);
  
  // Comments Logic
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const commentInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFollow = async () => {
      const action = isFollowing ? 'unfollow' : 'follow';
      setIsFollowing(!isFollowing);
      try {
          await api.followUser(currentUser.id, post.user_id, action);
      } catch (e) {
          setIsFollowing(!isFollowing); // Revert on error
      }
  }

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

  const handleReply = (userName: string) => {
      setNewComment(`@${userName} `);
      commentInputRef.current?.focus();
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 overflow-hidden transition-colors">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
            <Link to={`/user/${post.user_id}`}>
                <img 
                    src={post.photo || "https://picsum.photos/40/40"} 
                    className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-100 dark:border-gray-700" 
                />
            </Link>
            <div>
                <Link to={`/user/${post.user_id}`} className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline">{post.name}</Link>
                <span className="block text-[10px] text-gray-400">{formatTimeSP(post.timestamp)}</span>
            </div>
            
            {/* Botão Seguir Dinâmico */}
            {post.user_id !== currentUser.id && !isFollowing && (
                <button 
                    onClick={handleFollow}
                    className="ml-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                >
                    <UserPlus size={12} /> Seguir
                </button>
            )}
        </div>
        {post.user_id === currentUser.id && (
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
        )}
      </div>

      <div className="px-4 pb-2">
        {post.content && <p className="text-gray-800 dark:text-gray-200 text-sm mb-2 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
      </div>

      {post.media_type === 'image' && post.media_url && (
        <img src={post.media_url} className="w-full h-auto max-h-[450px] object-cover bg-gray-50" />
      )}

      {post.media_type === 'video' && post.media_url && (
        <div className="w-full bg-black relative group cursor-pointer" onClick={toggleVideo}>
            <video 
                ref={videoRef}
                src={post.media_url} 
                className="w-full h-auto max-h-[450px]" 
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
         <div className="px-4 pb-4">
             <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                 <AudioMessage src={post.media_url} isMe={false} />
             </div>
         </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 mt-1">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1.5 transition-transform active:scale-90 ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Heart size={22} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-semibold">{likesCount}</span>
          </button>

          <button onClick={toggleComments} className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400 hover:text-[#008069]">
            <MessageSquare size={22} />
            <span className="text-sm font-semibold">{commentsCount}</span>
          </button>
        </div>
      </div>

      {showComments && (
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
              <div className="flex gap-2 mb-3">
                  <input 
                    ref={commentInputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1 px-4 py-2 text-sm rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-[#008069] focus:ring-1 focus:ring-[#008069]"
                  />
                  <button onClick={sendComment} disabled={!newComment.trim()} className="p-2 bg-[#008069] text-white rounded-full disabled:opacity-50 hover:bg-[#006e5a] transition">
                      <Send size={18} />
                  </button>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                  {loadingComments ? <p className="text-xs text-center text-gray-400">Carregando...</p> : 
                   comments.map((c, i) => (
                      <div key={i} className="flex gap-2 group">
                          <img src={c.photo || "https://picsum.photos/30/30"} className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="flex-1 bg-white dark:bg-gray-800 p-2.5 rounded-2xl rounded-tl-none text-sm shadow-sm border border-gray-100 dark:border-gray-700 relative">
                              <span className="font-bold text-xs block text-gray-900 dark:text-gray-200 mb-0.5">{c.name}</span>
                              <p className="text-gray-700 dark:text-gray-300 leading-snug">{c.content}</p>
                              
                              <button 
                                onClick={() => handleReply(c.name)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-[#008069] opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Responder"
                              >
                                  <CornerDownRight size={14} />
                              </button>
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