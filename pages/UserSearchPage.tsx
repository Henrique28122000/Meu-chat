import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { Search, ArrowLeft } from 'lucide-react';

const UserSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
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
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex-none p-3 border-b bg-white sticky top-0 flex items-center gap-2 h-16">
        <Link to="/" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
           <ArrowLeft size={24} />
        </Link>
        <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name..."
                className="w-full bg-gray-100 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                autoFocus
            />
            <button type="submit" className="absolute right-3 text-gray-500 p-1">
                <Search size={18} />
            </button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {searching ? (
            <div className="text-center py-8 text-gray-500">Searching...</div>
        ) : (
            <ul className="space-y-2">
                {results.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl border border-gray-50 shadow-sm">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <img 
                                src={user.photo || "https://picsum.photos/50/50"} 
                                alt={user.name} 
                                className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate text-sm">{user.name}</h3>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <Link 
                            to={`/chat/${user.id}`} 
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 flex-shrink-0"
                        >
                            Chat
                        </Link>
                    </li>
                ))}
                {results.length === 0 && query && !searching && (
                    <div className="text-center text-gray-400 mt-10">
                        <Search size={48} className="mx-auto mb-2 opacity-20"/>
                        <p>No users found.</p>
                    </div>
                )}
            </ul>
        )}
      </div>
    </div>
  );
};

export default UserSearchPage;