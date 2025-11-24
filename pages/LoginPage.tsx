
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
      
      const photoUrl = user.photoURL || '';
      
      const response = await api.registerUser(
        user.displayName || 'Usuário',
        user.email || '',
        user.uid,
        photoUrl
      );

      const appUser = {
        uid: user.uid,
        id: response.user_id || user.uid,
        name: user.displayName,
        email: user.email,
        photo: photoUrl
      };

      onLogin(appUser);
    } catch (err: any) {
      console.error(err);
      setError('Falha no login com Google. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-6 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-64 bg-[#00a884] rounded-b-[30%] -z-0"></div>

      <div className="z-10 bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center">
          <div className="mb-6 p-4 bg-green-50 rounded-full">
            <MessageCircle size={64} className="text-[#008069]" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">PH Chat</h1>
          <p className="text-gray-500 mb-8 text-center text-sm">Conecte-se com amigos de forma rápida e segura.</p>
          
          {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center w-full bg-white border border-gray-300 shadow-sm hover:shadow-md text-gray-700 font-medium py-3 px-4 rounded-full transition-all hover:bg-gray-50 active:scale-95"
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
            Entrar com Google
          </button>
      </div>
      
      <p className="absolute bottom-6 text-xs text-gray-400">Desenvolvido com ❤️ por PH</p>
    </div>
  );
};

export default LoginPage;
