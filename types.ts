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

export interface ChatPreview {
  user_id: string;
  name: string;
  photo: string;
  last_message: string;
  unread_count: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  file_url?: string;
  file_path?: string;
  user_id?: string;
}