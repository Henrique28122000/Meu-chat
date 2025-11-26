
import React, { useState } from 'react';
import { Heart, MessageSquare, Play, Trash2, Send, UserPlus, CornerDownRight } from 'lucide-react';
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
  const [likesCount, setLikesCount] = useState(Number(post.likes_count)); // Force number
  const [commentsCount, setCommentsCount] = useState(Number(post.comments_count)); // Force number
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
    setLikesCount(prev => newLiked ? Number(prev) + 1 : Number(prev) - 1);
    
    try {
      await api.likePost(currentUser.id, post.id);
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount(prev => !newLiked ? Number(prev) + 1 : Number(prev) - 1);
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

  const loadComments = async () => {
      setLoadingComments(true);
      setShowComments(true);
      try {
          const data = await api.getComments(post.id);
          if(Array.isArray(data)) setComments(data);
      } catch(e) {}
      setLoadingComments(false);
  }

  const sendComment = async () => {
      if(!newComment.trim()) return;
      try {
          await api.commentPost(currentUser.id, post.id, newComment);
          setNewComment('');
          setCommentsCount(prev => Number(prev) + 1);
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
      // Scroll to input
      commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                    className="w-9 h-9 rounded-full object-cover bg-gray-200 border border-gray-100 dark:border-gray-700" 
                />
            </Link>
            <div>
                <Link to={`/user/${post.user_id}`} className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline block leading-tight">{post.name}</Link>
                {post.media_type === 'audio' && <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Publicou um áudio</span>}
            </div>
            
            {/* Botão Seguir Dinâmico */}
            {post.user_id !== currentUser.id && !isFollowing && (
                <button 
                    onClick={handleFollow}
                    className="ml-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                >
                    <UserPlus size={12} /> Seguir
                </button>
            )}
        </div>
        {post.user_id === currentUser.id && (
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
        )}
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        {post.content && <p className="text-gray-800 dark:text-gray-200 text-sm mb-2 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
      </div>

      {/* Media */}
      {post.media_type === 'image' && post.media_url && (
        <img src={post.media_url} className="w-full h-auto max-h-[500px] object-cover bg-gray-50" loading="lazy" />
      )}

      {post.media_type === 'video' && post.media_url && (
        <div className="w-full bg-black relative group cursor-pointer" onClick={toggleVideo}>
            <video 
                ref={videoRef}
                src={post.media_url} 
                className="w-full h-auto max-h-[500px]" 
                loop 
                playsInline
                onEnded={() => setIsPlaying(false)}
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-white/30 backdrop-blur-sm p-4 rounded-full shadow-lg">
                        <Play fill="white" className="text-white" size={32} />
                    </div>
                </div>
            )}
        </div>
      )}

      {post.media_type === 'audio' && post.media_url && (
         <div className="px-3 pb-3">
             <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                 <AudioMessage src={post.media_url} isMe={false} />
             </div>
         </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-transform active:scale-90 ${liked ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}
        >
            <Heart size={24} fill={liked ? "currentColor" : "none"} />
        </button>

        <button onClick={() => commentInputRef.current?.focus()} className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 hover:opacity-70">
            <MessageSquare size={24} className="-scale-x-100" />
        </button>
        
        <button className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 hover:opacity-70 ml-auto">
             <Send size={22} className="-rotate-12" />
        </button>
      </div>

      <div className="px-4 pb-4">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{likesCount} curtidas</p>
          
          {/* Instagram Style Comments */}
          {commentsCount > 0 && !showComments && (
              <button onClick={loadComments} className="text-gray-500 dark:text-gray-400 text-sm mb-2 hover:text-gray-700 dark:hover:text-gray-300">
                  Ver todos os {commentsCount} comentários
              </button>
          )}

          {/* Comment List */}
          {showComments && (
              <div className="space-y-3 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {loadingComments ? (
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                      comments.map((c, i) => (
                          <div key={i} className="flex gap-3 group">
                              <Link to={`/user/${c.user_id}`} className="flex-shrink-0">
                                  <img src={c.photo || "https://picsum.photos/30/30"} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                              </Link>
                              <div className="flex-1">
                                  <div className="flex flex-col">
                                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                                          <Link to={`/user/${c.user_id}`} className="font-bold mr-2 hover:underline text-gray-900 dark:text-white">{c.name}</Link>
                                          {c.content}
                                      </p>
                                      <div className="flex gap-3 mt-1">
                                          <span className="text-[10px] text-gray-400">{formatTimeSP(c.timestamp)}</span>
                                          <button 
                                            onClick={() => handleReply(c.name)}
                                            className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                                          >
                                              Responder
                                          </button>
                                      </div>
                                  </div>
                              </div>
                              <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-start">
                                  <Heart size={12} />
                              </button>
                          </div>
                      ))
                  )}
              </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
              {new Date(post.timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} • {formatTimeSP(post.timestamp)}
          </p>

          {/* Add Comment Input */}
          <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
              <img src={currentUser.photo} className="w-7 h-7 rounded-full object-cover" />
              <input 
                ref={commentInputRef}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 focus:outline-none placeholder-gray-400"
              />
              {newComment.trim() && (
                  <button onClick={sendComment} className="text-teal-600 dark:text-teal-400 font-bold text-sm hover:opacity-80">
                      Publicar
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};

export default PostCard;
