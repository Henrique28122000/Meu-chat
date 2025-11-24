import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import UserSearchPage from './pages/UserSearchPage';
import ProfilePage from './pages/ProfilePage';
import { User } from './types';
import { api } from './services/api';
import { User as UserIcon } from 'lucide-react';
import { messaging } from './services/firebase';
import { getToken } from 'firebase/messaging';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Restore session from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('ph_chat_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Save session
  useEffect(() => {
    if (user) {
      localStorage.setItem('ph_chat_user', JSON.stringify(user));
      // Setup Notifications
      setupNotifications(user.uid);
    } else {
      localStorage.removeItem('ph_chat_user');
    }
  }, [user]);

  const setupNotifications = async (uid: string) => {
    try {
      const msg = await messaging();
      if (msg) {
        // VAPID key usually needed for web. If you have one, add it here: { vapidKey: 'YOUR_KEY' }
        // For basic testing without a custom Service Worker in root, this might fail, which is caught below.
        const token = await getToken(msg); 
        if (token) {
          await api.saveFcmToken(uid, token);
        }
      }
    } catch (e) {
      console.log('Notification permission not granted or failed. Ensure firebase-messaging-sw.js is in public root.', e);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="h-full relative">
        <Routes>
            <Route 
                path="/login" 
                element={!user ? <LoginPage onLogin={setUser} /> : <Navigate to="/" />} 
            />
            <Route 
                path="/" 
                element={user ? <ChatListPage currentUser={user} /> : <Navigate to="/login" />} 
            />
            <Route 
                path="/chat/:id" 
                element={user ? <ChatRoomPage currentUser={user} /> : <Navigate to="/login" />} 
            />
            <Route 
                path="/search" 
                element={user ? <UserSearchPage /> : <Navigate to="/login" />} 
            />
            <Route 
                path="/profile" 
                element={user ? <ProfilePage user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} 
            />
        </Routes>

         {/* Simple Profile Link if on Home */}
         {user && location.pathname === '/' && (
             <Link to="/profile" className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-20 hover:bg-gray-100">
                <UserIcon size={24} className="text-gray-700" />
             </Link>
         )}
    </div>
  );
};

export default App;