export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}
