"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
} from "@/src/domain/types/auth.types";

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Authentication Store using Zustand
 * Manages user authentication state and actions
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login user with credentials
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Replace with actual API call to Supabase
          // For now, simulate API call with mock data
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Mock successful login
          const mockUser: User = {
            id: "user-001",
            email: credentials.email,
            username: "testuser",
            displayName: "Test User",
            avatar: null,
            bio: "นักเล่นดัมมี่มือใหม่",
            level: 1,
            exp: 0,
            coins: 1000,
            rank: 999,
            elo: 1000,
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          // Validate passwords match
          if (data.password !== data.confirmPassword) {
            throw new Error("รหัสผ่านไม่ตรงกัน");
          }

          // Validate terms acceptance
          if (!data.acceptTerms) {
            throw new Error("กรุณายอมรับข้อกำหนดการใช้งาน");
          }

          // TODO: Replace with actual API call to Supabase
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Mock successful registration
          const mockUser: User = {
            id: "user-new-001",
            email: data.email,
            username: data.username,
            displayName: data.displayName,
            avatar: null,
            bio: null,
            level: 1,
            exp: 0,
            coins: 1000, // Welcome bonus
            rank: 9999,
            elo: 1000,
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Logout user
       */
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      /**
       * Request password reset
       */
      forgotPassword: async (_data: ForgotPasswordData) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Replace with actual API call to Supabase
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Mock successful password reset request
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "ส่งคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Update user data
       */
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...userData,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "dummy-legends-auth-storage", // Key in localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
