
import { User, Message, ApiResponse, Status, Post, Comment, FollowStats } from '../types';

const BASE_URL = 'https://paulohenriquedev.site/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, options);
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  const data = await response.json();
  return data as T;
}

export const api = {
  // --- Auth & Users ---
  registerUser: async (name: string, email: string, uid: string, photo: string) => {
    return request<ApiResponse<any>>('registerUser.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: uid, photo, uid }),
    });
  },

  getUser: async (user_id: string) => {
    const data = await request<User | User[]>(`getUser.php?user_id=${user_id}`);
    return Array.isArray(data) ? data[0] : data;
  },

  getProfileStats: async (my_id: string, target_id: string) => {
    // Retorna dados do usuário + contadores de seguidores + se eu sigo ele
    return request<User & FollowStats>(`getUserProfile.php?my_id=${my_id}&target_id=${target_id}`);
  },

  searchUsers: async (query: string) => {
    return request<User[]>(`searchUsers.php?q=${query}`);
  },

  updateProfile: async (user_id: string, name: string, photo: string) => {
    return request<ApiResponse<any>>('updateProfile.php', {
      method: 'POST',
      body: JSON.stringify({ user_id, name, photo }),
    });
  },

  followUser: async (follower_id: string, followed_id: string, action: 'follow' | 'unfollow') => {
    return request<ApiResponse<any>>('followUser.php', {
      method: 'POST',
      body: JSON.stringify({ follower_id, followed_id, action }),
    });
  },

  // --- Messages ---
  getChats: async (user_id: string) => {
    return request<any[]>(`getMessages.php?user_id=${user_id}`);
  },

  getChatMessages: async (user1_id: string, user2_id: string) => {
    return request<Message[]>(`getChatMessages.php?user1_id=${user1_id}&user2_id=${user2_id}`);
  },

  sendMessage: async (sender_id: string, receiver_id: string, content: string, type: 'text' | 'audio') => {
    return request<ApiResponse<any>>('sendMessage.php', {
      method: 'POST',
      body: JSON.stringify({ sender_id, receiver_id, content, type }),
    });
  },

  // --- Feed & Posts ---
  getPosts: async (user_id: string) => {
    // user_id serve para verificar se 'eu' curti os posts
    return request<Post[]>(`getPosts.php?user_id=${user_id}`);
  },

  createPost: async (user_id: string, content: string, media_url: string, media_type: string) => {
    return request<ApiResponse<any>>('createPost.php', {
      method: 'POST',
      body: JSON.stringify({ user_id, content, media_url, media_type }),
    });
  },

  likePost: async (user_id: string, post_id: string) => {
    return request<ApiResponse<any>>('interactPost.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'like', user_id, post_id }),
    });
  },

  commentPost: async (user_id: string, post_id: string, content: string) => {
    return request<ApiResponse<any>>('interactPost.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'comment', user_id, post_id, content }),
    });
  },

  getComments: async (post_id: string) => {
    return request<Comment[]>(`getComments.php?post_id=${post_id}`);
  },

  // --- Status ---
  getStatuses: async () => {
    return request<Status[]>('getStatuses.php');
  },

  postStatus: async (user_id: string, media_url: string, media_type: string, caption: string) => {
     return request<ApiResponse<any>>('postStatus.php', {
      method: 'POST',
      body: JSON.stringify({ user_id, media_url, media_type, caption }),
    });
  },

  // --- Uploads ---
  uploadAudio: async (audioBlob: Blob, sender_id: string, receiver_id: string = '0') => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.mp3');
    // Para posts, receiver_id pode ser ignorado no PHP ou mande '0'
    formData.append('sender_id', sender_id);
    
    const response = await fetch(`${BASE_URL}/uploadAudio.php`, { method: 'POST', body: formData });
    return response.json();
  },

  uploadPhoto: async (file: File, user_id: string) => {
    const formData = new FormData();
    formData.append('photo_file', file);
    formData.append('user_id', user_id);
    const response = await fetch(`${BASE_URL}/uploadPhoto.php`, { method: 'POST', body: formData });
    return response.json() as Promise<ApiResponse<any>>;
  },

  uploadVideo: async (file: File, user_id: string) => {
    const formData = new FormData();
    formData.append('video_file', file);
    formData.append('user_id', user_id);
    const response = await fetch(`${BASE_URL}/uploadVideo.php`, { method: 'POST', body: formData });
    return response.json() as Promise<ApiResponse<any>>;
  },
  
  saveFcmToken: async (uid: string, token: string) => {
    return request<ApiResponse<any>>('saveToken.php', {
      method: 'POST',
      body: JSON.stringify({ uid, token }),
    });
  }
};
