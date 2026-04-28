import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runnerApi } from '../lib/api';
import type { RunnerProfile } from '../types/runner.types';

interface RunnerAuthState {
  token: string | null;
  runner: RunnerProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  getMe: () => Promise<void>;
  updateProfile: (data: Partial<RunnerProfile>) => Promise<void>;
}

export const useRunnerAuthStore = create<RunnerAuthState>()(
  persist(
    (set) => ({
      token: null,
      runner: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await runnerApi.post('/auth/login', { email, password });
          set({ token: res.data.token, runner: res.data.runner, isLoading: false });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
          throw err;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const res = await runnerApi.post('/auth/register', { email, password, name });
          set({ token: res.data.token, runner: res.data.runner, isLoading: false });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ token: null, runner: null, error: null });
      },

      getMe: async () => {
        set({ isLoading: true });
        try {
          const res = await runnerApi.get('/auth/me');
          // /me returns the profile directly, not wrapped in { runner: ... }
          const runner = res.data.runner || res.data;
          set({ runner, isLoading: false });
        } catch {
          set({ token: null, runner: null, isLoading: false });
        }
      },

      updateProfile: async (data) => {
        try {
          const res = await runnerApi.put('/profile', data);
          set({ runner: res.data.runner });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Update failed' });
          throw err;
        }
      },
    }),
    {
      name: 'runner-auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
