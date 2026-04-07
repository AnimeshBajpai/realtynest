import { create } from 'zustand'
import api from '../lib/api'
import type { Agency } from '../types'

interface AgencyContextState {
  agencies: Agency[]
  selectedAgencyId: string | null
  selectedAgencyName: string | null
  loading: boolean
  fetchAgencies: () => Promise<void>
  setAgency: (id: string | null, name?: string | null) => void
  clear: () => void
}

export const useAgencyContextStore = create<AgencyContextState>()((set) => ({
  agencies: [],
  selectedAgencyId: localStorage.getItem('agencyContextId'),
  selectedAgencyName: localStorage.getItem('agencyContextName'),
  loading: false,

  fetchAgencies: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/admin/agencies')
      set({ agencies: data.agencies, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setAgency: (id, name = null) => {
    if (id) {
      localStorage.setItem('agencyContextId', id)
      localStorage.setItem('agencyContextName', name ?? '')
    } else {
      localStorage.removeItem('agencyContextId')
      localStorage.removeItem('agencyContextName')
    }
    set({ selectedAgencyId: id, selectedAgencyName: name })
  },

  clear: () => {
    localStorage.removeItem('agencyContextId')
    localStorage.removeItem('agencyContextName')
    set({ selectedAgencyId: null, selectedAgencyName: null, agencies: [] })
  },
}))
