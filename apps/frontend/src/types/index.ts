export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
  tags: string[];
  isAvailable: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
}

export interface Exchange {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  initiatorId: string;
  receiverId: string;
  itemId: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  initiator: User;
  receiver: User;
  item: Item;
  messages?: Message[];
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  exchangeId: string;
  createdAt: string;
  sender: User;
}

export interface WeeklyTheme {
  id: string;
  title: string;
  description: string;
  weekNumber: number;
  year: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  suggestedItems: SuggestedItem[];
}

export interface SuggestedItem {
  id: string;
  title: string;
  description: string;
  category: string;
  reason: string;
  themeId: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
