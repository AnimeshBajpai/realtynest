import { create } from 'zustand';
import { runnerApi } from '../lib/api';
import type { CoachMessage, TrainingPlan, CheckInData, PlannedActivity } from '../types/runner.types';

interface CoachState {
  greeting: CoachMessage | null;
  todayActivity: PlannedActivity | null;
  currentPlan: TrainingPlan | null;
  checkedInToday: boolean;
  isLoading: boolean;
  error: string | null;
  fetchGreeting: () => Promise<void>;
  submitCheckIn: (data: CheckInData) => Promise<void>;
  fetchCurrentPlan: () => Promise<void>;
  fetchTodayActivity: () => Promise<void>;
}

export const useCoachStore = create<CoachState>()((set) => ({
  greeting: null,
  todayActivity: null,
  currentPlan: null,
  checkedInToday: false,
  isLoading: false,
  error: null,

  fetchGreeting: async () => {
    try {
      const res = await runnerApi.get('/coach/greeting');
      set({ greeting: res.data.greeting || res.data, isLoading: false });
    } catch {
      set({ greeting: null, isLoading: false });
    }
  },

  submitCheckIn: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await runnerApi.post('/coach/check-in', data);
      set({ checkedInToday: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Check-in failed', isLoading: false });
      throw err;
    }
  },

  fetchCurrentPlan: async () => {
    try {
      const res = await runnerApi.get('/plan/current');
      set({ currentPlan: res.data.plan || res.data, isLoading: false });
    } catch {
      set({ currentPlan: null, isLoading: false });
    }
  },

  fetchTodayActivity: async () => {
    try {
      const res = await runnerApi.get('/activity/recent', { params: { limit: 1 } });
      const activities = res.data.activities || res.data || [];
      const today = activities[0] || null;
      set({ todayActivity: today, checkedInToday: !!today });
    } catch {
      set({ todayActivity: null });
    }
  },
}));
