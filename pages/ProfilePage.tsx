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
      alert('Profile updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
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
      <header className="p-4 border-b flex items-center bg-white sticky top-0 z-10">
        <Link to="/" className="mr-4 text-gray-600">
           <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-6">
            <img 
                src={photoPreview || "https://picsum.photos/150/150"} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>

        <div className="w-full max-w-sm space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                />
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex justify-center items-center"
            >
                {saving ? 'Saving...' : <><Save size={20} className="mr-2" /> Save Changes</>}
            </button>

            <button 
                onClick={handleLogout}
                className="w-full border border-red-200 text-red-600 font-bold py-3 rounded-lg hover:bg-red-50 transition flex justify-center items-center mt-8"
            >
                <LogOut size={20} className="mr-2" /> Logout
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
