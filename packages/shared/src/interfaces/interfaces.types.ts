export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export const COGNITO_GROUPS = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const GSI_PREFIX = {
  USERS: 'USERS',
} as const;

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
