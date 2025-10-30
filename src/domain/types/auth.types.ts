/**
 * Authentication & User Types
 */

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  exp: number;
  coins: number;
  rank: number;
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
  token: string;
}
