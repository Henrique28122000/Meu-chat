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
      <header className="p-4 border-b flex items-center bg-white sticky top-0">
        <Link to="/" className="mr-4 text-gray-600">
           <ArrowLeft size={24} />
        </Link>
        <form onSubmit={handleSearch} className="flex-1 relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email..."
                className="w-full bg-gray-100 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-500">
                <Search size={18} />
            </button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {searching ? (
            <div className="text-center py-4">Searching...</div>
        ) : (
            <ul className="space-y-4">
                {results.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <img 
                                src={user.photo || "https://picsum.photos/50/50"} 
                                alt={user.name} 
                                className="w-12 h-12 rounded-full object-cover bg-gray-200"
                            />
                            <div>
                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <Link 
                            to={`/chat/${user.id}`} 
                            className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-200"
                        >
                            Message
                        </Link>
                    </li>
                ))}
                {results.length === 0 && query && !searching && (
                    <div className="text-center text-gray-500 mt-10">No users found.</div>
                )}
            </ul>
        )}
      </div>
    </div>
  );
};

export default UserSearchPage;
