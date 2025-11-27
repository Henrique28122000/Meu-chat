
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { Search, ArrowLeft } from 'lucide-react';

const UserSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setSearching(true);
        try {
          const data = await api.searchUsers(query);
          if (Array.isArray(data)) {
            setResults(data);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setSearching(false);
        }
      } else {
          setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-20">
      <header className="flex-none p-4 gradient-bg sticky top-0 flex items-center gap-3 h-20 shadow-md z-10 rounded-b-3xl">
        <Link to="/" className="p-2 text-white hover:bg-white/20 rounded-full transition">
           <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 relative flex items-center">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou @usuario..."
                className="w-full bg-white/10 text-white placeholder-white/60 rounded-2xl py-2.5 pl-4 pr-10 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/30 text-base backdrop-blur-sm transition-all"
                autoFocus
            />
            {searching ? (
                 <div className="absolute right-3 w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
                 <Search size={18} className="absolute right-3 text-white/60" />
            )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 pl-2">Resultados</h2>
            <ul className="space-y-3">
                {results.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm transition-all">
                        <Link to={`/user/${user.id}`} className="flex items-center space-x-3 overflow-hidden flex-1">
                            <img 
                                src={user.photo || "https://picsum.photos/50/50"} 
                                alt={user.name} 
                                className="w-12 h-12 rounded-xl object-cover bg-gray-200 dark:bg-gray-600 flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">{user.name}</h3>
                                <p className="text-sm text-teal-600 dark:text-teal-400 font-medium truncate">@{user.username || 'user'}</p>
                                {user.bio && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.bio}</p>}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
      </div>
    </div>
  );
};

export default UserSearchPage;
