
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
      <header className="p-4 bg-[#008069] text-white flex items-center shadow-md sticky top-0 z-10">
        <Link to="/" className="mr-4 hover:bg-[#006e5a] p-1 rounded-full">
           <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Perfil</h1>
      </header>

      <div className="p-6 flex flex-col items-center overflow-y-auto">
        <div className="relative mb-8 mt-4">
            <img 
                src={photoPreview || "https://picsum.photos/150/150"} 
                alt="Profile" 
                className="w-40 h-40 rounded-full object-cover border-4 border-gray-100 shadow-lg bg-gray-200"
            />
            <label className="absolute bottom-1 right-1 bg-[#008069] text-white p-3 rounded-full cursor-pointer hover:bg-[#006e5a] shadow-lg transition-transform hover:scale-105">
                <Camera size={22} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>

        <div className="w-full max-w-sm space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="block text-xs font-bold text-[#008069] mb-1 uppercase tracking-wide">Nome</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-300 py-1 focus:border-[#008069] focus:outline-none text-lg text-gray-800"
                />
                <p className="text-xs text-gray-400 mt-2">Esse não é seu nome de usuário ou PIN. Esse nome será visível para seus contatos.</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="block text-xs font-bold text-[#008069] mb-1 uppercase tracking-wide">Email</label>
                <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="w-full bg-transparent border-b border-transparent py-1 text-lg text-gray-500 cursor-not-allowed"
                />
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#008069] text-white font-bold py-3.5 rounded-full hover:bg-[#006e5a] transition shadow-md flex justify-center items-center active:scale-95"
            >
                {saving ? 'Salvando...' : <><Save size={20} className="mr-2" /> Salvar Alterações</>}
            </button>

            <button 
                onClick={handleLogout}
                className="w-full border border-red-200 text-red-600 font-bold py-3.5 rounded-full hover:bg-red-50 transition flex justify-center items-center mt-8"
            >
                <LogOut size={20} className="mr-2" /> Sair da conta
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
