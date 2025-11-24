
import { User, Message, ApiResponse, Status } from '../types';

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
    return request<ApiResponse<any>>('registerUser.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: uid, photo, uid }),
    });
  },

  getUser: async (user_id: string) => {
    // Check if response is array or object to be safe
    const data = await request<User | User[]>(`getUser.php?user_id=${user_id}`);
    return Array.isArray(data) ? data[0] : data;
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

  // Status
  getStatuses: async () => {
    // Ensure you create getStatuses.php on server
    try {
        return await request<Status[]>('getStatuses.php');
    } catch (e) {
        console.warn("Status API not found or error", e);
        return [];
    }
  },

  postStatus: async (user_id: string, image_url: string, caption: string) => {
     // Ensure you create postStatus.php on server
     return request<ApiResponse<any>>('postStatus.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, image_url, caption }),
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
