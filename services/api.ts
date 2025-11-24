import { User, Message, ApiResponse } from '../types';

const BASE_URL = 'https://paulohenriquedev.site/api';

// Helper to handle API requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return data as T;
}

export const api = {
  // Auth & Users
  registerUser: async (name: string, email: string, uid: string, photo: string) => {
    // Mapping Firebase data to PHP endpoint expected format
    return request<ApiResponse<any>>('registerUser.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: uid, photo, uid }), // Sending UID as password/identifier
    });
  },

  getUser: async (user_id: string) => {
    return request<User>(`getUser.php?user_id=${user_id}`);
  },

  searchUsers: async (query: string) => {
    return request<User[]>(`searchUsers.php?q=${query}`);
  },

  updateProfile: async (user_id: string, name: string, photo: string) => {
    return request<ApiResponse<any>>('updateProfile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, name, photo }),
    });
  },

  // Messages
  getChats: async (user_id: string) => {
    // Note: Endpoint provided was getMessages.php?user_id=123 for "all conversations"
    return request<any[]>(`getMessages.php?user_id=${user_id}`);
  },

  getChatMessages: async (user1_id: string, user2_id: string) => {
    return request<Message[]>(`getChatMessages.php?user1_id=${user1_id}&user2_id=${user2_id}`);
  },

  sendMessage: async (sender_id: string, receiver_id: string, content: string, type: 'text' | 'audio') => {
    return request<ApiResponse<any>>('sendMessage.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id, receiver_id, content, type }),
    });
  },

  // Media
  uploadAudio: async (audioBlob: Blob, sender_id: string, receiver_id: string) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.mp3');
    formData.append('sender_id', sender_id);
    formData.append('receiver_id', receiver_id);

    const response = await fetch(`${BASE_URL}/uploadAudio.php`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  uploadPhoto: async (file: File, user_id: string) => {
    const formData = new FormData();
    formData.append('photo_file', file);
    formData.append('user_id', user_id);

    const response = await fetch(`${BASE_URL}/uploadPhoto.php`, {
      method: 'POST',
      body: formData,
    });
    return response.json() as Promise<ApiResponse<any>>;
  },
  
  // Notifications
  saveFcmToken: async (uid: string, token: string) => {
    return request<ApiResponse<any>>('saveToken.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token }),
    });
  }
};
