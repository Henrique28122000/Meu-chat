
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { Search, ArrowLeft } from 'lucide-react';

const UserSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Auto-search logic (Debounce)
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
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex-none p-3 border-b bg-white sticky top-0 flex items-center gap-2 h-16 shadow-sm z-10">
        <Link to="/" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
           <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 relative flex items-center">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nome..."
                className="w-full bg-gray-100 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#008069] text-base"
                autoFocus
            />
            {searching ? (
                 <div className="absolute right-3 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                 <Search size={18} className="absolute right-3 text-gray-500" />
            )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
                {results.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg active:bg-gray-100">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <img 
                                src={user.photo || "https://picsum.photos/50/50"} 
                                alt={user.name} 
                                className="w-12 h-12 rounded-full object-cover bg-gray-200 flex-shrink-0 border border-gray-100"
                            />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate text-base">{user.name}</h3>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <Link 
                            to={`/chat/${user.id}`} 
                            className="text-[#008069] font-semibold text-sm px-3 py-2 rounded-full hover:bg-green-50"
                        >
                            Conversar
                        </Link>
                    </li>
                ))}
                {results.length === 0 && query && !searching && (
                    <div className="text-center text-gray-400 mt-10">
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                )}
                {results.length === 0 && !query && (
                    <div className="text-center text-gray-400 mt-10">
                        <p className="text-sm">Digite para buscar novos contatos</p>
                    </div>
                )}
            </ul>
      </div>
    </div>
  );
};

export default UserSearchPage;
