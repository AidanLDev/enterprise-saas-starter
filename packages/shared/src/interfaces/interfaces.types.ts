export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export const ENTITY_PREFIX = {
  USER: 'USER#',
  PROJECT: 'PROJECT#',
} as const;
