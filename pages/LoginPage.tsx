
import React, { useState } from 'react';
import { auth, registerWithEmail, loginWithEmail } from '../services/firebase';
import { api } from '../services/api';
import { MessageCircle, Mail, Lock, User, Calendar, AtSign, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Only Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (isRegistering) {
            // --- REGISTRO ---
            
            // 1. Validações básicas
            if(!username.trim() || !name.trim() || !birthdate) {
                throw new Error("Preencha todos os campos.");
            }

            const cleanUsername = username.replace('@', '').toLowerCase();
            
            // 2. Verifica se username existe no PHP antes de criar no Firebase
            const isAvailable = await api.checkUsername(cleanUsername);
            if (!isAvailable) {
                throw new Error(`O usuário @${cleanUsername} já está em uso.`);
            }

            // 3. Cria usuário no Firebase Auth (Email/Senha)
            const userCredential = await registerWithEmail(auth, email, password);
            const user = userCredential.user;

            // 4. Salva dados no SQL via PHP
            const response = await api.registerUser(
                name, 
                email, 
                user.uid, 
                cleanUsername, 
                birthdate
            );

            if(response.status === 'success') {
                 const appUser = {
                    uid: user.uid,
                    id: user.uid,
                    name: name,
                    email: email,
                    photo: "https://ui-avatars.com/api/?name="+encodeURIComponent(name)+"&background=0D8ABC&color=fff",
                    username: cleanUsername,
                    bio: "Novo usuário"
                 };
                 onLogin(appUser);
            } else {
                throw new Error(response.message || "Erro ao salvar dados do perfil.");
            }

        } else {
            // --- LOGIN ---
            const userCredential = await loginWithEmail(auth, email, password);
            const user = userCredential.user;

            // Busca dados completos do PHP
            const profile = await api.getUser(user.uid);
            
            if (profile && (profile as any).id) {
                 onLogin(profile);
            } else {
                 // Fallback caso usuário exista no Firebase mas não no SQL (raro)
                 throw new Error("Perfil não encontrado. Contate o suporte.");
            }
        }
    } catch (err: any) {
        console.error(err);
        let msg = err.message;
        if(msg.includes('auth/email-already-in-use')) msg = "Este email já está cadastrado.";
        if(msg.includes('auth/wrong-password')) msg = "Senha incorreta.";
        if(msg.includes('auth/user-not-found')) msg = "Usuário não encontrado.";
        if(msg.includes('auth/weak-password')) msg = "A senha deve ter pelo menos 6 caracteres.";
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors">
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-[#008069] to-[#00a884] rounded-b-[40%] -z-0 shadow-lg"></div>

      <div className="z-10 w-full max-w-sm px-6">
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col w-full border border-gray-100 dark:border-gray-700 transition-all">
              <div className="mb-6 flex flex-col items-center">
                <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-full mb-3 shadow-inner">
                    <MessageCircle size={40} className="text-[#008069] dark:text-teal-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">PH Chat</h1>
                <p className="text-gray-400 text-xs text-center mt-1">
                    {isRegistering ? "Crie sua conta e conecte-se." : "Bem-vindo de volta!"}
                </p>
              </div>
              
              {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-medium border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2">
                      {error}
                  </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                  
                  {isRegistering && (
                    <>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Nome Completo" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                            />
                        </div>
                        
                        <div className="relative group">
                            <AtSign className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Usuário (ex: paulo123)" 
                                value={username}
                                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                            />
                        </div>

                        <div className="relative group">
                            <Calendar className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                            <input 
                                type="date" 
                                value={birthdate}
                                onChange={e => setBirthdate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                            />
                        </div>
                    </>
                  )}

                  <div className="relative group">
                      <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                      <input 
                        type="email" 
                        placeholder="Seu Email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                        required 
                      />
                  </div>

                  <div className="relative group">
                      <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                      <input 
                        type="password" 
                        placeholder="Sua Senha" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                        required 
                        minLength={6}
                      />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#008069] text-white font-bold py-3 rounded-xl hover:bg-[#006e5a] transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 mt-2 active:scale-95"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isRegistering ? 'Criar Conta' : 'Entrar'} <ArrowRight size={18} />
                      </>
                    )}
                  </button>
              </form>

              <div className="mt-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {isRegistering ? "Já tem uma conta?" : "Ainda não tem conta?"}
                  </p>
                  <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                    className="text-[#008069] dark:text-teal-400 font-bold text-sm hover:underline mt-1"
                  >
                      {isRegistering ? "Fazer Login" : "Cadastre-se Agora"}
                  </button>
              </div>
          </div>
      </div>
      
      <p className="absolute bottom-6 text-xs text-gray-400">© 2024 PH Chat App</p>
    </div>
  );
};

export default LoginPage;
