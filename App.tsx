
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import UserSearchPage from './pages/UserSearchPage';
import ProfilePage from './pages/ProfilePage';
import StatusPage from './pages/StatusPage';
import DiscoverPage from './pages/DiscoverPage';
import SocialProfilePage from './pages/SocialProfilePage';
import BottomNav from './components/BottomNav';
import { User } from './types';
import { api } from './services/api';
import { messaging } from './services/firebase';
import { getToken } from 'firebase/messaging';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dark Mode Init
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('ph_chat_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      api.getUser(parsedUser.id).then((latestUser) => {
          if(latestUser && (latestUser as User).id) {
              const u = latestUser as User;
              if(u.photo !== parsedUser.photo || u.name !== parsedUser.name) {
                  const updated = { ...parsedUser, photo: u.photo, name: u.name };
                  setUser(updated);
                  localStorage.setItem('ph_chat_user', JSON.stringify(updated));
              }
          }
      }).catch(err => console.log("Background user fetch failed", err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ph_chat_user', JSON.stringify(user));
      setupNotifications(user.uid);
    } else {
      localStorage.removeItem('ph_chat_user');
    }
  }, [user]);

  const setupNotifications = async (uid: string) => {
    try {
      const msg = await messaging();
      if (msg) {
        const token = await getToken(msg); 
        if (token) {
          await api.saveFcmToken(uid, token);
        }
      }
    } catch (e) {
      console.log('Notificações indisponíveis');
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-[#e5ddd5] dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#008069] border-t-transparent"></div></div>;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Routes>
            <Route path="/login" element={!user ? <LoginPage onLogin={setUser} /> : <Navigate to="/" />} />
            
            <Route path="/" element={user ? <ChatListPage currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/discover" element={user ? <DiscoverPage currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/status" element={user ? <StatusPage currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
            
            <Route path="/chat/:id" element={user ? <ChatRoomPage currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/user/:id" element={user ? <SocialProfilePage currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/search" element={user ? <UserSearchPage /> : <Navigate to="/login" />} />
        </Routes>
        
        {user && <BottomNav />}
    </div>
  );
};

export default App;