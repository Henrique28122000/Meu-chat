
import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Play, Trash2 } from 'lucide-react';
import { Post, User } from '../types';
import { api } from '../services/api';
import AudioMessage from './AudioMessage';

interface PostCardProps {
  post: Post;
  currentUser: User;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser }) => {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [deleted, setDeleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
                className="w-8 h-8 rounded-full object-cover mr-2" 
            />
            <div>
                <h3 className="font-bold text-sm text-gray-900">{post.name}</h3>
                <span className="text-[10px] text-gray-400">{new Date(post.timestamp).toLocaleDateString()}</span>
            </div>
        </div>
        {post.user_id === currentUser.id && (
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
        )}
      </div>

      <div className="px-3 pb-2">
        {post.content && <p className="text-gray-800 text-sm mb-2">{post.content}</p>}
      </div>

      {post.media_type === 'image' && post.media_url && (
        <img src={post.media_url} className="w-full h-auto max-h-[400px] object-cover" />
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

      <div className="flex items-center justify-between px-4 py-2 mt-1">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-semibold">{likesCount}</span>
          </button>

          <button className="flex items-center space-x-1 text-gray-500">
            <MessageSquare size={20} />
            <span className="text-sm font-semibold">{post.comments_count}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;