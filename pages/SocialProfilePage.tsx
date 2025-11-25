
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

  if(loading || !profile) return <div className="h-full bg-white"></div>;

  return (
    <div className="flex flex-col h-full bg-white pb-20 overflow-y-auto">
        <div className="h-32 bg-[#008069] relative">
             <Link to="/" className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-sm"><ArrowLeft /></Link>
        </div>

        <div className="px-6 relative -mt-12 mb-6">
            <div className="flex justify-between items-end">
                <img src={profile.photo || "https://picsum.photos/100/100"} className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200" />
                
                {/* Only show actions if not me */}
                {profile.id !== currentUser.id && (
                <div className="flex gap-2 mb-2">
                    <Link to={`/chat/${profile.id}`} className="p-2.5 bg-gray-100 text-gray-700 rounded-full font-bold border border-gray-200"><MessageCircle size={20}/></Link>
                    <button 
                        onClick={toggleFollow}
                        className={`px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-sm transition-all ${
                            profile.is_following ? 'bg-gray-200 text-gray-800' : 'bg-[#008069] text-white'
                        }`}
                    >
                        {profile.is_following ? <><UserCheck size={18}/> Seguindo</> : <><UserPlus size={18}/> Seguir</>}
                    </button>
                </div>
                )}
            </div>
            
            <div className="mt-3">
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-500 text-sm">{profile.email}</p>
            </div>

            <div className="flex gap-6 mt-6 py-4 border-y border-gray-100">
                <div className="text-center">
                    <span className="block font-bold text-lg text-gray-800">{posts.length}</span>
                    <span className="text-xs text-gray-500">Posts</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-gray-800">{profile.followers}</span>
                    <span className="text-xs text-gray-500">Seguidores</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-gray-800">{profile.following}</span>
                    <span className="text-xs text-gray-500">Seguindo</span>
                </div>
            </div>
        </div>

        <div className="px-4 bg-gray-50 pt-4 flex-1">
            {posts.length === 0 ? <p className="text-gray-400 text-sm text-center py-10">Nenhuma publicação ainda.</p> : (
                posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} />)
            )}
        </div>
    </div>
  );
};

export default SocialProfilePage;