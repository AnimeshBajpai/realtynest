import { create } from 'zustand'
import api from '../lib/api'
import type { User, AuthResponse } from '../types'
import { AxiosError } from 'axios'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>
  register: (data: {
    agencyName: string
    adminName: string
    email: string
    phone: string
    password: string
  }) => Promise<void>
  logout: () => void
  getMe: () => Promise<void>
  setUser: (user: User) => void
  clearError: () => void
}

const token = localStorage.getItem('token')

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  token,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials)
      localStorage.setItem('token', data.token)
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error?.message ||
            err.response?.data?.message ||
            'Login failed'
          : 'Login failed'
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.post<AuthResponse>(
        '/auth/register',
        data
      )
      localStorage.setItem('token', res.token)
      set({
        user: res.user,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error?.message ||
            err.response?.data?.message ||
            'Registration failed'
          : 'Registration failed'
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    window.location.href = '/login'
  },

  getMe: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ user: User }>('/auth/me')
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),
}))
