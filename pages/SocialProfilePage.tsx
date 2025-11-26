
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, FollowStats, Post } from '../types';
import PostCard from '../components/PostCard';
import { ArrowLeft, MessageCircle, UserCheck, UserPlus } from 'lucide-react';

interface SocialProfilePageProps {
  currentUser: User;
}

const SocialProfilePage: React.FC<SocialProfilePageProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<User & FollowStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        api.getProfileStats(currentUser.id, id).then(data => setProfile(data)).catch(console.error);
        api.getPosts(currentUser.id).then(allPosts => {
            setPosts(allPosts.filter(p => p.user_id === id));
        });
        setLoading(false);
    }
  }, [id, currentUser.id]);

  const toggleFollow = async () => {
      if(!profile) return;
      const action = profile.is_following ? 'unfollow' : 'follow';
      
      setProfile(prev => prev ? ({
          ...prev, 
          is_following: !prev.is_following,
          followers: prev.is_following ? prev.followers - 1 : prev.followers + 1
      }) : null);

      try {
          await api.followUser(currentUser.id, profile.id, action);
      } catch (e) {
          console.error(e);
      }
  }

  if(loading || !profile) return <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-20 overflow-y-auto no-scrollbar">
        {/* Banner */}
        <div className="h-32 gradient-bg relative shrink-0">
             <Link to="/" className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-sm hover:bg-black/30 transition z-10"><ArrowLeft size={20} /></Link>
        </div>

        {/* Profile Info */}
        <div className="px-5 relative -mt-12 mb-2 shrink-0">
            <div className="flex justify-between items-end">
                <img 
                    src={profile.photo || "https://picsum.photos/100/100"} 
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 shadow-lg bg-gray-200 object-cover" 
                />
                
                {/* Actions */}
                {profile.id !== currentUser.id && (
                <div className="flex gap-2 mb-2">
                    <Link to={`/chat/${profile.id}`} className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"><MessageCircle size={20}/></Link>
                    <button 
                        onClick={toggleFollow}
                        className={`px-5 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-sm transition-all text-sm ${
                            profile.is_following ? 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : 'bg-[#008069] text-white hover:bg-[#006e5a]'
                        }`}
                    >
                        {profile.is_following ? <><UserCheck size={18}/> Seguindo</> : <><UserPlus size={18}/> Seguir</>}
                    </button>
                </div>
                )}
            </div>
            
            <div className="mt-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{profile.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{profile.email}</p>
            </div>

            {/* Stats */}
            <div className="flex justify-around mt-6 py-4 border-y border-gray-100 dark:border-gray-800">
                <div className="text-center w-1/3">
                    <span className="block font-bold text-xl text-gray-800 dark:text-gray-100">{posts.length}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Posts</span>
                </div>
                <div className="text-center w-1/3 border-l border-r border-gray-100 dark:border-gray-800">
                    <span className="block font-bold text-xl text-gray-800 dark:text-gray-100">{profile.followers}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seguidores</span>
                </div>
                <div className="text-center w-1/3">
                    <span className="block font-bold text-xl text-gray-800 dark:text-gray-100">{profile.following}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seguindo</span>
                </div>
            </div>
        </div>

        {/* Posts List */}
        <div className="px-4 bg-gray-50 dark:bg-gray-950 pt-4 flex-1">
            {posts.length === 0 ? <p className="text-gray-400 text-sm text-center py-10">Nenhuma publicação ainda.</p> : (
                posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} />)
            )}
            <div className="h-4"></div>
        </div>
    </div>
  );
};

export default SocialProfilePage;
