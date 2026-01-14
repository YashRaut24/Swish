export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Swish';

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  COMMUNITIES: 'communities',
};

export const USER_ROLES = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  COMMUNITY: 'Community',
  ADMIN: 'Admin',
};

export const VIEWS = {
  HOME: 'home',
  EXPLORE: 'explore',
  PROFILE: 'profile',
  CHAT: 'chat',
  COMMUNITY: 'community',
  NOTIFICATIONS: 'notifications',
  ADMIN: 'admin',
  SEARCH: 'search',
  SAVED: 'saved',
  TRENDING: 'trending',
};

export const MAX_FILE_SIZE = Infinity; // No limit
export const ACCEPTED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg'
];

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_CAPTION_LENGTH: 500,
  MAX_COMMENT_LENGTH: 200,
  MAX_BIO_LENGTH: 150,
  MAX_COMMUNITY_NAME_LENGTH: 50,
};

export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  COMMUNITY_POST: 'community_post',
  REPORT: 'report',
};

















// Add this to src/utils/constants.js to fix the error
export const COMMUNITIES = [
  {
    id: 1,
    name: 'General',
    description: 'General campus discussions',
    avatar: 'https://ui-avatars.com/api/?name=General&background=random'
  },
  {
    id: 2,
    name: 'Tech & Coding',
    description: 'Programming, hackathons, and tech news',
    avatar: 'https://ui-avatars.com/api/?name=Tech&background=random'
  },
  {
    id: 3,
    name: 'Events',
    description: 'College fests and workshops',
    avatar: 'https://ui-avatars.com/api/?name=Events&background=random'
  },
  {
    id: 4,
    name: 'Sports',
    description: 'Sports updates and teams',
    avatar: 'https://ui-avatars.com/api/?name=Sports&background=random'
  }
];