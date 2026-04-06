import { create } from 'zustand'
import api from '../lib/api'
import { AxiosError } from 'axios'
import type { Property, LeadProperty, PropertyType, PropertyStatus, InterestLevel } from '../types'

export interface PropertyFilters {
  search?: string
  type?: PropertyType
  status?: PropertyStatus
  priceMin?: number
  priceMax?: number
}

interface PropertyState {
  properties: Property[]
  selectedProperty: Property | null
  propertyLeads: LeadProperty[]
  isLoading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  filters: PropertyFilters
}

interface PropertyActions {
  fetchProperties: (filters?: PropertyFilters) => Promise<void>
  fetchProperty: (id: string) => Promise<void>
  createProperty: (data: Partial<Property>) => Promise<Property>
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>
  deleteProperty: (id: string) => Promise<void>
  linkLead: (propertyId: string, data: { leadId: string; interestLevel: InterestLevel; notes?: string }) => Promise<void>
  unlinkLead: (propertyId: string, leadId: string) => Promise<void>
  fetchPropertyLeads: (propertyId: string) => Promise<void>
  setFilters: (filters: PropertyFilters) => void
  clearFilters: () => void
  setPage: (page: number) => void
  clearError: () => void
  clearSelectedProperty: () => void
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

export const usePropertyStore = create<PropertyState & PropertyActions>()((set, get) => ({
  properties: [],
  selectedProperty: null,
  propertyLeads: [],
  isLoading: false,
  error: null,
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  filters: {},

  fetchProperties: async (filters) => {
    set({ isLoading: true, error: null })
    try {
      const currentFilters = filters ?? get().filters
      const params: Record<string, string | number> = {
        page: get().page,
        limit: get().limit,
      }
      if (currentFilters.search) params.search = currentFilters.search
      if (currentFilters.type) params.type = currentFilters.type
      if (currentFilters.status) params.status = currentFilters.status
      if (currentFilters.priceMin) params.priceMin = currentFilters.priceMin
      if (currentFilters.priceMax) params.priceMax = currentFilters.priceMax

      const { data } = await api.get('/properties', { params })
      set({
        properties: data.properties ?? data.data ?? [],
        total: data.total ?? 0,
        page: data.page ?? get().page,
        totalPages: data.totalPages ?? 0,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to fetch properties') })
    }
  },

  fetchProperty: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get(`/properties/${id}`)
      set({ selectedProperty: data.property ?? data, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to fetch property') })
    }
  },

  createProperty: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.post('/properties', data)
      set({ isLoading: false })
      get().fetchProperties()
      return res.property ?? res
    } catch (err) {
      const message = extractError(err, 'Failed to create property')
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  updateProperty: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: res } = await api.put(`/properties/${id}`, data)
      set({ selectedProperty: res.property ?? res, isLoading: false })
      get().fetchProperties()
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to update property') })
    }
  },

  deleteProperty: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await api.delete(`/properties/${id}`)
      set({ isLoading: false, selectedProperty: null })
      get().fetchProperties()
    } catch (err) {
      set({ isLoading: false, error: extractError(err, 'Failed to delete property') })
    }
  },

  linkLead: async (propertyId, data) => {
    set({ error: null })
    try {
      await api.post(`/properties/${propertyId}/leads`, data)
      get().fetchPropertyLeads(propertyId)
    } catch (err) {
      set({ error: extractError(err, 'Failed to link lead') })
    }
  },

  unlinkLead: async (propertyId, leadId) => {
    set({ error: null })
    try {
      await api.delete(`/properties/${propertyId}/leads/${leadId}`)
      get().fetchPropertyLeads(propertyId)
    } catch (err) {
      set({ error: extractError(err, 'Failed to unlink lead') })
    }
  },

  fetchPropertyLeads: async (propertyId) => {
    try {
      const { data } = await api.get(`/properties/${propertyId}/leads`)
      set({ propertyLeads: data.leads ?? data.data ?? [] })
    } catch {
      set({ propertyLeads: [] })
    }
  },

  setFilters: (filters) => set({ filters, page: 1 }),
  clearFilters: () => set({ filters: {}, page: 1 }),
  setPage: (page) => set({ page }),
  clearError: () => set({ error: null }),
  clearSelectedProperty: () => set({ selectedProperty: null, propertyLeads: [] }),
}))
