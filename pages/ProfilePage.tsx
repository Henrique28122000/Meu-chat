
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, FollowStats } from '../types';
import { Camera, Save, LogOut, Eye, Moon, Sun, CheckCircle, XCircle } from 'lucide-react';
import { auth } from '../services/firebase';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [photoPreview, setPhotoPreview] = useState(user.photo);
  const [file, setFile] = useState<File | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  useEffect(() => {
      api.getProfileStats(user.id, user.id).then(data => setStats(data)).catch(console.error);
  }, [user.id]);

  // Username Availability Check
  useEffect(() => {
      const delayFn = setTimeout(async () => {
          if (username !== user.username && username.trim().length > 2) {
              setUsernameStatus('checking');
              const isAvailable = await api.checkUsername(username);
              setUsernameStatus(isAvailable ? 'available' : 'taken');
          } else {
              setUsernameStatus('idle');
          }
      }, 500);
      return () => clearTimeout(delayFn);
  }, [username, user.username]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPhotoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    if (usernameStatus === 'taken') return alert("Nome de usuário indisponível.");
    
    setSaving(true);
    try {
      let finalPhotoUrl = user.photo;
      if (file) {
         const uploadRes = await api.uploadPhoto(file, user.id);
         if (uploadRes.file_url) finalPhotoUrl = uploadRes.file_url;
      }
      
      const cleanUsername = username.replace('@', '').toLowerCase();
      
      await api.updateProfile(user.id, name, finalPhotoUrl, cleanUsername, bio);
      alert('Perfil atualizado com sucesso!');
      // Update local storage logic handled in App.tsx via API fetch, but we can force reload or notify parent if needed
    } catch (err) {
      alert('Falha ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
      auth.signOut();
      onLogout();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-20 overflow-y-auto">
      <header className="p-4 pt-6 gradient-bg text-white flex items-center justify-between shadow-lg sticky top-0 z-10 rounded-b-3xl">
        <h1 className="text-xl font-bold ml-2">Editar Perfil</h1>
        <button onClick={toggleTheme} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
           {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-6 mt-4">
            <div className="p-1 rounded-full border-4 border-teal-100 dark:border-teal-900 shadow-xl">
                <img 
                    src={photoPreview || "https://picsum.photos/150/150"} 
                    alt="Profile" 
                    className="w-36 h-36 rounded-full object-cover"
                />
            </div>
            <label className="absolute bottom-1 right-1 bg-teal-600 text-white p-3 rounded-2xl cursor-pointer hover:bg-teal-700 shadow-lg border-4 border-white dark:border-gray-800">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-8 w-full justify-center">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl min-w-[90px]">
                <span className="block font-bold text-xl text-gray-800 dark:text-gray-100">{stats?.followers || 0}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seguidores</span>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl min-w-[90px]">
                <span className="block font-bold text-xl text-gray-800 dark:text-gray-100">{stats?.following || 0}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seguindo</span>
            </div>
        </div>

        <div className="w-full max-w-sm space-y-6">
            
            {/* Name Input */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <label className="block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">Nome</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 dark:border-gray-600 py-1 focus:border-teal-500 focus:outline-none text-base text-gray-800 dark:text-gray-200 font-medium"
                />
            </div>

            {/* Username Input */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <label className="block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">Usuário (@)</label>
                <div className="flex items-center">
                    <span className="text-gray-500 mr-1">@</span>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-600 py-1 focus:border-teal-500 focus:outline-none text-base text-gray-800 dark:text-gray-200 font-medium"
                    />
                    {usernameStatus === 'checking' && <span className="absolute right-4 text-xs text-gray-400">...</span>}
                    {usernameStatus === 'available' && <CheckCircle size={18} className="absolute right-4 text-green-500" />}
                    {usernameStatus === 'taken' && <XCircle size={18} className="absolute right-4 text-red-500" />}
                </div>
                {usernameStatus === 'taken' && <p className="text-red-500 text-[10px] mt-1">Nome de usuário indisponível</p>}
            </div>

            {/* Bio Input */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <label className="block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">Bio</label>
                <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 dark:text-gray-300 resize-none"
                    placeholder="Conte um pouco sobre você..."
                />
            </div>
            
            <Link to={`/user/${user.id}`} className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <Eye size={18} /> Ver meu perfil público
            </Link>

            <button 
                onClick={handleSave}
                disabled={saving || usernameStatus === 'taken'}
                className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 flex justify-center items-center disabled:opacity-50"
            >
                {saving ? 'Salvando...' : <><Save size={20} className="mr-2" /> Salvar Alterações</>}
            </button>

            <button 
                onClick={handleLogout}
                className="w-full border-2 border-red-100 dark:border-red-900/50 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition flex justify-center items-center mt-4"
            >
                <LogOut size={20} className="mr-2" /> Sair da conta
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
