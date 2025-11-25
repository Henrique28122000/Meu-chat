
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
        // Fetch Profile + Stats
        api.getProfileStats(currentUser.id, id).then(data => setProfile(data)).catch(console.error);
        // Fetch User Posts (filtering from getPosts mainly, ideal would be getUserPosts endpoint)
        api.getPosts(currentUser.id).then(allPosts => {
            setPosts(allPosts.filter(p => p.user_id === id));
        });
        setLoading(false);
    }
  }, [id, currentUser.id]);

  const toggleFollow = async () => {
      if(!profile) return;
      const action = profile.is_following ? 'unfollow' : 'follow';
      
      // Optimistic UI
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

  if(loading || !profile) return <div className="h-full bg-white"></div>;

  return (
    <div className="flex flex-col h-full bg-white pb-20 overflow-y-auto">
        {/* Cover Photo area */}
        <div className="h-32 bg-gradient-to-r from-teal-400 to-emerald-600 relative">
             <Link to="/search" className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-sm"><ArrowLeft /></Link>
        </div>

        {/* Profile Info */}
        <div className="px-6 relative -mt-12 mb-6">
            <div className="flex justify-between items-end">
                <img src={profile.photo || "https://picsum.photos/100/100"} className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg bg-gray-200" />
                <div className="flex gap-2 mb-2">
                    <Link to={`/chat/${profile.id}`} className="p-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold border border-gray-200"><MessageCircle size={20}/></Link>
                    <button 
                        onClick={toggleFollow}
                        className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                            profile.is_following ? 'bg-gray-800 text-white' : 'bg-teal-600 text-white shadow-teal-500/30'
                        }`}
                    >
                        {profile.is_following ? <><UserCheck size={18}/> Seguindo</> : <><UserPlus size={18}/> Seguir</>}
                    </button>
                </div>
            </div>
            
            <div className="mt-3">
                <h1 className="text-xl font-extrabold text-gray-900">{profile.name}</h1>
                <p className="text-gray-400 text-sm">{profile.email}</p>
            </div>

            <div className="flex gap-6 mt-6 py-4 border-y border-gray-50">
                <div className="text-center">
                    <span className="block font-bold text-lg text-gray-800">{posts.length}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase">Posts</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-gray-800">{profile.followers}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase">Seguidores</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-gray-800">{profile.following}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase">Seguindo</span>
                </div>
            </div>
        </div>

        {/* User Posts */}
        <div className="px-4">
            <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 ml-1">Publicações</h3>
            {posts.length === 0 ? <p className="text-gray-400 text-sm text-center py-10">Nenhuma publicação ainda.</p> : (
                posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} />)
            )}
        </div>
    </div>
  );
};

export default SocialProfilePage;
