
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
}

export interface Status {
  id: string;
  user_id: string;
  name: string;
  photo: string;
  media_url: string; // Renomeado de image_url para ser genérico
  media_type: 'image' | 'video' | 'text' | 'audio';
  caption?: string;
  timestamp: string;
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

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  file_url?: string;
  file_path?: string;
  user_id?: string;
}
