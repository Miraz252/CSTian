
export interface User {
  id: string;
  rollNumber: string;
  name: string;
  bio?: string;
  profileImage?: string;
  gpaHistory: number[];
  socialLinks: {
    facebook?: string;
    messenger?: string;
    linkedin?: string;
  };
  role: 'student' | 'admin';
  lastReadAt?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
  author: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export type AppView = 'dashboard' | 'notices' | 'chat' | 'results' | 'profile';
