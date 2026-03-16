import { create } from 'zustand';
import { User } from '../types';
import { setAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// TODO: Remove mock user before production
const MOCK_USER: User = {
  id: 'mock-1',
  email: 'demo@snoozestake.com',
  displayName: 'Demo User',
  walletBalance: 25.00,
  currentStreak: 7,
  longestStreak: 14,
  totalSnoozed: 12.50,
  totalSaved: 42.00,
  referralCode: 'DEMO2026',
  createdAt: new Date().toISOString(),
};

// Set the mock token on the API client at startup
setAuthToken('mock-token');

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USER,
  token: 'mock-token',
  isAuthenticated: true,
  setAuth: (user, token) => {
    setAuthToken(token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
