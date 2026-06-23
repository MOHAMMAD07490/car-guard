export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  error?: string;
}
