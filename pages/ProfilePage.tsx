import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { ArrowLeft, Camera, Save, LogOut } from 'lucide-react';
import { auth } from '../services/firebase';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [photoPreview, setPhotoPreview] = useState(user.photo);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPhotoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalPhotoUrl = user.photo;
      
      if (file) {
         const uploadRes = await api.uploadPhoto(file, user.id);
         if (uploadRes.file_url) {
             finalPhotoUrl = uploadRes.file_url;
         }
      }

      await api.updateProfile(user.id, name, finalPhotoUrl);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error(err);
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
    <div className="flex flex-col h-full bg-white">
      <header className="p-4 pt-6 gradient-bg text-white flex items-center shadow-lg sticky top-0 z-10 rounded-b-3xl">
        <Link to="/" className="mr-4 hover:bg-white/20 p-2 rounded-full transition">
           <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Meu Perfil</h1>
      </header>

      <div className="p-6 flex flex-col items-center overflow-y-auto">
        <div className="relative mb-8 mt-4">
            <div className="p-1 rounded-full border-4 border-teal-100 shadow-xl">
                <img 
                    src={photoPreview || "https://picsum.photos/150/150"} 
                    alt="Profile" 
                    className="w-36 h-36 rounded-full object-cover"
                />
            </div>
            <label className="absolute bottom-1 right-1 bg-teal-600 text-white p-3 rounded-2xl cursor-pointer hover:bg-teal-700 shadow-lg transition-transform hover:scale-110 active:scale-95 border-4 border-white">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>

        <div className="w-full max-w-sm space-y-6">
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm">
                <label className="block text-xs font-bold text-teal-600 mb-2 uppercase tracking-wide">Nome de Exibição</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-gray-200 py-1 focus:border-teal-500 focus:outline-none text-lg text-gray-800 transition-colors font-medium"
                />
                <p className="text-xs text-gray-400 mt-3">Esse nome será visível para seus contatos nas conversas.</p>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm opacity-80">
                <label className="block text-xs font-bold text-teal-600 mb-2 uppercase tracking-wide">Email</label>
                <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="w-full bg-transparent border-b-2 border-transparent py-1 text-lg text-gray-500 cursor-not-allowed font-medium"
                />
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 flex justify-center items-center active:scale-95"
            >
                {saving ? 'Salvando...' : <><Save size={20} className="mr-2" /> Salvar Alterações</>}
            </button>

            <button 
                onClick={handleLogout}
                className="w-full border-2 border-red-100 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition flex justify-center items-center mt-4"
            >
                <LogOut size={20} className="mr-2" /> Sair da conta
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;