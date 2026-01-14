import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin } from '../types';
import { api } from '../utils/api';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const data = await api<{ token: string; admin: Admin }>('/auth/login', {
          method: 'POST',
          body: { email, password }
        });

        localStorage.setItem('token', data.token);
        set({ token: data.token, admin: data.admin, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, admin: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ token: null, admin: null, isAuthenticated: false });
          return;
        }

        try {
          const data = await api<{ admin: Admin }>('/auth/me');
          set({ token, admin: data.admin, isAuthenticated: true });
        } catch {
          localStorage.removeItem('token');
          set({ token: null, admin: null, isAuthenticated: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);
