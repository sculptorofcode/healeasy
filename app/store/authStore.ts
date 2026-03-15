import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, setTokenForApi } from '../services/apiClient';

// Storage abstraction using AsyncStorage
const storage = {
  async get(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`[Storage] Retrieved token:`, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error('[Storage] Error retrieving token:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`[Storage] Token stored successfully`);
    } catch (error) {
      console.error('[Storage] Error storing token:', error);
    }
  },

  async clear(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`[Storage] Token cleared successfully`);
    } catch (error) {
      console.error('[Storage] Error clearing token:', error);
    }
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });

      const response = await apiPost<{ user: AuthUser; token: string }>('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data;

      // Store token using the storage abstraction
      await storage.set('auth_token', token);
      // Also sync to API client for immediate use
      await setTokenForApi(token);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    console.log('Auth store register called with:', { name, email, password: '[HIDDEN]' });
    try {
      set({ isLoading: true });

      const response = await apiPost<{ user: AuthUser; token: string }>('/auth/register', {
        name,
        email,
        password,
      });

      const { user, token } = response.data;
      console.log('Registration successful:', { user, token });

      // Store token using the storage abstraction
      await storage.set('auth_token', token);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear token from storage using the storage abstraction
      await storage.clear('auth_token');

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state even if storage clear fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  restoreSession: async () => {
    console.log('[AuthStore] Starting session restore...');
    try {
      set({ isLoading: true });

      // Get token from storage using the storage abstraction
      const token = await storage.get('auth_token');
      console.log('[AuthStore] Retrieved token:', token ? 'exists' : 'not found');

      if (!token) {
        console.log('[AuthStore] No token found, user not authenticated');
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }

      // Decode user info from token (simple implementation)
      // In production, you might want to validate with server
      const payload = JSON.parse(atob(token.split('.')[1])); // Simple decode
      console.log('[AuthStore] Session restored for user:', payload.email);

      set({
        user: { id: payload.sub, name: payload.name, email: payload.email },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[AuthStore] Session restore error:', error);
      // Clear invalid token from storage
      try {
        await storage.clear('auth_token');
      } catch (clearError) {
        console.error('[AuthStore] Failed to clear invalid token:', clearError);
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));