import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  role: string;  // 'student' | 'teacher' | 'superadmin' | 'warden'
  name?: string;
  email?: string;
  mustChangePassword?: boolean;
  onboardingDone?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (token: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: (token, refreshToken) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    const decoded = jwtDecode(token) as User;
    set({ user: decoded, token });
  },

  updateUser: (updates) => {
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }));
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null });
  },

  initialize: () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token) as User;
        set({ user: decoded, token });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
  },
}));
