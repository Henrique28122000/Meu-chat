
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Globe, Zap, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath === path ? "text-teal-600 scale-110" : "text-gray-400 hover:text-gray-600";
  };

  // Não mostrar na tela de login ou dentro de um chat específico
  if (currentPath === '/login' || currentPath.startsWith('/chat/')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md bg-white/90 backdrop-blur-lg shadow-2xl border border-white/20 rounded-full z-50 h-16 flex items-center justify-around px-2">
      <Link to="/" className={`flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${isActive('/')}`}>
        <MessageCircle size={24} fill={currentPath === '/' ? "currentColor" : "none"} />
        {currentPath === '/' && <span className="w-1 h-1 bg-teal-600 rounded-full mt-1"></span>}
      </Link>
      
      <Link to="/discover" className={`flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${isActive('/discover')}`}>
        <Globe size={24} />
        {currentPath === '/discover' && <span className="w-1 h-1 bg-teal-600 rounded-full mt-1"></span>}
      </Link>

      <Link to="/status" className={`flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${isActive('/status')}`}>
        <Zap size={24} fill={currentPath === '/status' ? "currentColor" : "none"} />
        {currentPath === '/status' && <span className="w-1 h-1 bg-teal-600 rounded-full mt-1"></span>}
      </Link>

      <Link to="/profile" className={`flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${isActive('/profile')}`}>
        <User size={24} fill={currentPath === '/profile' ? "currentColor" : "none"} />
        {currentPath === '/profile' && <span className="w-1 h-1 bg-teal-600 rounded-full mt-1"></span>}
      </Link>
    </div>
  );
};

export default BottomNav;
