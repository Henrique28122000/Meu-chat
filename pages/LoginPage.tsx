import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { api } from '../services/api';
import { MessageCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Register/Login with PHP Backend
      // The API returns { status: 'success', user_id: 123 } usually, or we use UID
      const photoUrl = user.photoURL || '';
      
      // We pass the Firebase UID to the PHP backend.
      // Ideally backend returns the MySQL ID.
      const response = await api.registerUser(
        user.displayName || 'User',
        user.email || '',
        user.uid,
        photoUrl
      );

      // Create a unified user object
      const appUser = {
        uid: user.uid,
        id: response.user_id || user.uid, // Fallback if API doesn't return ID immediately
        name: user.displayName,
        email: user.email,
        photo: photoUrl
      };

      onLogin(appUser);
    } catch (err: any) {
      console.error(err);
      setError('Failed to login via Google. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-6">
      <div className="mb-8 p-4 bg-blue-100 rounded-full">
        <MessageCircle size={64} className="text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Welcome to PH Chat</h1>
      <p className="text-gray-500 mb-8 text-center">Connect with friends securely via our custom platform.</p>
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex items-center justify-center w-full max-w-xs bg-white border border-gray-300 shadow-sm hover:shadow-md text-gray-700 font-medium py-3 px-4 rounded-lg transition-all"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></span>
        ) : (
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5 mr-3"
          />
        )}
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginPage;
