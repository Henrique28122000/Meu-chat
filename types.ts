
export interface User {
  id: string; // Internal API ID
  uid: string; // Firebase UID
  name: string;
  email: string;
  photo: string;
  fcmToken?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'audio';
  timestamp: string;
  is_sent_by_me?: boolean;
  is_read?: boolean;
  is_deleted?: boolean;
}

export interface Status {
  id: string;
  user_id: string;
  name: string;
  photo: string;
  media_url: string;
  media_type: 'image' | 'video' | 'text' | 'audio';
  caption?: string;
  timestamp: string;
  viewed_by_me?: boolean;
  viewers_count?: number;
}

export interface StatusGroup {
  user_id: string;
  user_name: string;
  user_photo: string;
  statuses: Status[];
  hasUnviewed: boolean;
}

export interface Viewer {
  name: string;
  photo: string;
}

export interface Post {
  id: string;
  user_id: string;
  name: string;
  photo: string;
  content: string;
  media_url?: string;
  media_type: 'text' | 'image' | 'video' | 'audio';
  likes_count: number;
  comments_count: number;
  timestamp: string;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  name: string;
  photo: string;
  content: string;
  timestamp: string;
}

export interface FollowStats {
  followers: number;
  following: number;
  is_following: boolean;
}

export interface Notification {
  type: 'liked' | 'follow';
  name: string;
  photo: string;
  content: string;
  timestamp?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  file_url?: string;
  file_path?: string;
  user_id?: string;
  deleted?: number;
}

// Helper para hora de São Paulo
export const formatTimeSP = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Sao_Paulo'
    }).format(date);
  } catch (e) {
    return '';
  }
};
