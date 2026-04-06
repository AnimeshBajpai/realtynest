export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatarUrl?: string
  role: 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'BROKER'
  agencyId?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface Agency {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
  subscriptionPlan: 'FREE' | 'BASIC' | 'PRO'
  isActive: boolean
}

export interface AuthResponse {
  user: User
  agency?: Agency
  token: string
}

export interface ApiError {
  error: {
    message: string
    statusCode: number
  }
}

// Lead types
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'
export type LeadSource = 'WALK_IN' | 'PHONE' | 'WEBSITE' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'OTHER'
export type LeadPriority = 'HOT' | 'WARM' | 'COLD'

export interface Lead {
  id: string
  agencyId: string
  assignedToId?: string
  createdById: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  budgetMin?: number
  budgetMax?: number
  preferredLocation?: string
  propertyTypePreference?: string
  notes?: string
  createdAt: string
  updatedAt: string
  assignedTo?: { id: string; firstName: string; lastName: string; email: string }
  createdBy?: { id: string; firstName: string; lastName: string; email: string }
}

export interface LeadActivity {
  id: string
  leadId: string
  userId: string
  action: string
  oldValue?: string
  newValue?: string
  metadata?: Record<string, unknown>
  createdAt: string
  user?: { firstName: string; lastName: string }
}

export interface LeadStats {
  total: number
  byStatus: Record<LeadStatus, number>
  bySource: Record<LeadSource, number>
  byPriority: Record<LeadPriority, number>
  newThisMonth: number
  conversionRate: number
}

export interface PaginatedResponse<T> {
  leads: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
