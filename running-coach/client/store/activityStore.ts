import { create } from 'zustand';
import { runnerApi } from '../lib/api';
import type { ActivityLog } from '../types/runner.types';

interface ActivityState {
  recentActivities: ActivityLog[];
  history: ActivityLog[];
  isLogging: boolean;
  isLoading: boolean;
  error: string | null;
  lastPlanAdjustments: string[];
  clearPlanAdjustments: () => void;
  logActivity: (data: {
    distanceKm: number;
    durationMinutes: number;
    effortLevel: number;
    notes?: string;
  }) => Promise<{ xpEarned: number; levelUp: boolean; newLevel?: number; planAdjustments?: string[] }>;
  updateActivity: (id: string, data: {
    distanceKm?: number;
    durationMinutes?: number;
    effortLevel?: number;
    notes?: string;
  }) => Promise<ActivityLog>;
  deleteActivity: (id: string) => Promise<void>;
  fetchRecentActivities: (limit?: number) => Promise<void>;
  fetchHistory: (params?: { startDate?: string; endDate?: string; page?: number }) => Promise<void>;
}

export const useActivityStore = create<ActivityState>()((set) => ({
  recentActivities: [],
  history: [],
  isLogging: false,
  isLoading: false,
  error: null,
  lastPlanAdjustments: [],

  clearPlanAdjustments: () => set({ lastPlanAdjustments: [] }),

  logActivity: async (data) => {
    set({ isLogging: true, error: null });
    try {
      const res = await runnerApi.post('/activity', data);
      const result = res.data;
      const adjustments = result.planAdjustments || [];
      set((state) => ({
        recentActivities: [result.activity, ...state.recentActivities],
        isLogging: false,
        lastPlanAdjustments: adjustments,
      }));
      return { xpEarned: result.xpEarned, levelUp: result.levelUp, newLevel: result.newLevel, planAdjustments: adjustments };
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to log activity', isLogging: false });
      throw err;
    }
  },

  updateActivity: async (id, data) => {
    set({ error: null });
    try {
      const res = await runnerApi.put(`/activity/${id}`, data);
      const updated = res.data;
      set((state) => ({
        history: state.history.map((a) => (a.id === id ? { ...a, ...updated } : a)),
        recentActivities: state.recentActivities.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to update activity' });
      throw err;
    }
  },

  deleteActivity: async (id) => {
    set({ error: null });
    try {
      await runnerApi.delete(`/activity/${id}`);
      set((state) => ({
        history: state.history.filter((a) => a.id !== id),
        recentActivities: state.recentActivities.filter((a) => a.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to delete activity' });
      throw err;
    }
  },

  fetchRecentActivities: async (limit = 5) => {
    set({ isLoading: true, error: null });
    try {
      const res = await runnerApi.get('/activity/recent', { params: { limit } });
      set({ recentActivities: res.data.activities || res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch activities', isLoading: false });
    }
  },

  fetchHistory: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await runnerApi.get('/activity', { params });
      set({ history: res.data.activities || res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch history', isLoading: false });
    }
  },
}));
