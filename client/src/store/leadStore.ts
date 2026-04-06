import { create } from 'zustand'
import api from '../lib/api'
import { AxiosError } from 'axios'
import type {
  Lead,
  LeadActivity,
  LeadStats,
  LeadStatus,
  LeadSource,
  LeadPriority,
  PaginatedResponse,
} from '../types'

export interface LeadFilters {
  search?: string
  status?: LeadStatus
  source?: LeadSource
  priority?: LeadPriority
  assignedToId?: string
}

interface LeadState {
  leads: Lead[]
  selectedLead: Lead | null
  stats: LeadStats | null
  timeline: LeadActivity[]
  isLoading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  filters: LeadFilters
}

interface LeadActions {
  fetchLeads: (filters?: LeadFilters) => Promise<void>
  fetchLead: (id: string) => Promise<void>
  createLead: (data: Partial<Lead>) => Promise<Lead>
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>
  assignLead: (id: string, assignedToId: string) => Promise<void>
  fetchTimeline: (id: string) => Promise<void>
  fetchStats: () => Promise<void>
  setFilters: (filters: LeadFilters) => void
  clearFilters: () => void
  setPage: (page: number) => void
  clearError: () => void
  clearSelectedLead: () => void
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      fallback
    )
  }
  return fallback
}

export const useLeadStore = create<LeadState & LeadActions>()((set, get) => ({
  leads: [],
  selectedLead: null,
  stats: null,
  timeline: [],
  isLoading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  filters: {},

  fetchLeads: async (filters) => {
    set({ isLoading: true, error: null })
    try {
      const currentFilters = filters ?? get().filters
      const params: Record<string, string | number> = {
        page: get().page,
        limit: get().limit,
      }
      if (currentFilters.search) params.search = currentFilters.search
      if (currentFilters.status) params.status = currentFilters.status
      if (currentFilters.source) params.source = currentFilters.source
      if (currentFilters.priority) params.priority = currentFilters.priority
      if (currentFilters.assignedToId) params.assignedToId = currentFilters.assignedToId

      const { data } = await api.get<PaginatedResponse<Lead>>('/leads', { params })
      set({
        leads: data.leads,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to fetch leads') })
    }
  },

  fetchLead: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ lead: Lead }>(`/leads/${id}`)
      set({ selectedLead: data.lead, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to fetch lead') })
    }
  },

  createLead: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.post<{ lead: Lead }>('/leads', data)
      set({ isLoading: false })
      get().fetchLeads()
      return res.lead
    } catch (err) {
      const message = extractError(err, 'Failed to create lead')
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  updateLead: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.put<{ lead: Lead }>(`/leads/${id}`, data)
      set({ selectedLead: res.lead, isLoading: false })
      get().fetchLeads()
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to update lead') })
    }
  },

  updateLeadStatus: async (id, status) => {
    set({ error: null })
    try {
      const { data } = await api.patch<{ lead: Lead }>(`/leads/${id}/status`, { status })
      set({ selectedLead: data.lead })
      get().fetchLeads()
    } catch (err) {
      set({ error: extractError(err, 'Failed to update status') })
    }
  },

  assignLead: async (id, assignedToId) => {
    set({ error: null })
    try {
      const { data } = await api.patch<{ lead: Lead }>(`/leads/${id}/assign`, { assignedToId })
      set({ selectedLead: data.lead })
      get().fetchLeads()
    } catch (err) {
      set({ error: extractError(err, 'Failed to assign lead') })
    }
  },

  fetchTimeline: async (id) => {
    try {
      const { data } = await api.get<{ activities: LeadActivity[] }>(`/leads/${id}/timeline`)
      set({ timeline: data.activities })
    } catch {
      set({ timeline: [] })
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await api.get<{ stats: LeadStats }>('/leads/stats')
      set({ stats: data.stats })
    } catch {
      // stats are non-critical
    }
  },

  setFilters: (filters) => {
    set({ filters, page: 1 })
  },

  clearFilters: () => {
    set({ filters: {}, page: 1 })
  },

  setPage: (page) => {
    set({ page })
  },

  clearError: () => set({ error: null }),

  clearSelectedLead: () => set({ selectedLead: null, timeline: [] }),
}))
