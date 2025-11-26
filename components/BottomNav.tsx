
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Globe, Zap, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath === path ? "text-[#008069] scale-110" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300";
  };

  if (currentPath === '/login' || currentPath.startsWith('/chat/')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 h-16 flex items-center justify-around px-2 pb-2 transition-colors">
      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive('/')}`}>
        <MessageCircle size={24} fill={currentPath === '/' ? "currentColor" : "none"} />
        <span className="text-[10px] font-bold mt-1">Conversas</span>
      </Link>
      
      <Link to="/status" className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive('/status')}`}>
        <Zap size={24} fill={currentPath === '/status' ? "currentColor" : "none"} />
        <span className="text-[10px] font-bold mt-1">Status</span>
      </Link>

      <Link to="/discover" className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive('/discover')}`}>
        <Globe size={24} />
        <span className="text-[10px] font-bold mt-1">Descobrir</span>
      </Link>

      <Link to="/profile" className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive('/profile')}`}>
        <User size={24} fill={currentPath === '/profile' ? "currentColor" : "none"} />
        <span className="text-[10px] font-bold mt-1">Perfil</span>
      </Link>
    </div>
  );
};

export default BottomNav;