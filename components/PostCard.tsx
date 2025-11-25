
import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Play, Pause } from 'lucide-react';
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
  const [showComments, setShowComments] = useState(false);
  
  // Video Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      await api.likePost(currentUser.id, post.id);
    } catch (e) {
      console.error(e);
      // Revert on error
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4">
        <img 
            src={post.photo || "https://picsum.photos/40/40"} 
            className="w-10 h-10 rounded-full object-cover border border-gray-100" 
        />
        <div className="ml-3">
          <h3 className="font-bold text-sm text-gray-900">{post.name}</h3>
          <span className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {post.content && <p className="text-gray-800 text-sm mb-3">{post.content}</p>}
      </div>

      {/* Media */}
      {post.media_type === 'image' && post.media_url && (
        <div className="w-full bg-black">
             <img src={post.media_url} className="w-full h-auto max-h-[400px] object-contain" />
        </div>
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
         <div className="px-4 pb-4">
             <div className="bg-gray-100 rounded-2xl p-2">
                 <AudioMessage src={post.media_url} isMe={false} />
             </div>
         </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1.5 ${liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Heart size={22} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-semibold">{likesCount}</span>
          </button>

          <button className="flex items-center space-x-1.5 text-gray-500 hover:text-teal-600">
            <MessageSquare size={22} />
            <span className="text-sm font-semibold">{post.comments_count}</span>
          </button>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
            <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
