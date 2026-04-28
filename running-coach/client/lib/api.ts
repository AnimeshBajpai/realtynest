import axios from 'axios';
import { useRunnerAuthStore } from '../store/runnerAuthStore';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/running-coach`
  : '/api/running-coach';

export const runnerApi = axios.create({ baseURL });

runnerApi.interceptors.request.use((config) => {
  const token = useRunnerAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

runnerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useRunnerAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
