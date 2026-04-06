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

// Property types
export type PropertyType = 'APARTMENT' | 'VILLA' | 'PLOT' | 'COMMERCIAL'
export type PropertyStatus = 'AVAILABLE' | 'SOLD' | 'RESERVED'
export type InterestLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type CommunicationType = 'CALL' | 'MEETING' | 'EMAIL' | 'SMS' | 'NOTE'

export interface Property {
  id: string
  agencyId: string
  name: string
  type: PropertyType
  address?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
  price?: number
  areaSqft?: number
  bedrooms?: number
  bathrooms?: number
  status: PropertyStatus
  description?: string
  images?: string[]
  createdAt: string
  updatedAt: string
}

export interface LeadProperty {
  id: string
  leadId: string
  propertyId: string
  interestLevel: InterestLevel
  notes?: string
  createdAt: string
  lead?: { id: string; firstName: string; lastName: string; email?: string; phone?: string; status: LeadStatus }
  property?: Property
}

export interface Communication {
  id: string
  leadId: string
  userId: string
  type: CommunicationType
  subject?: string
  body?: string
  outcome?: string
  scheduledAt?: string
  completedAt?: string
  createdAt: string
  user?: { firstName: string; lastName: string }
}

// Dashboard types
export interface BrokerDashboard {
  myLeads: { total: number; active: number; converted: number }
  byStatus: Record<string, number>
  upcomingFollowUps: Array<{ id: string; leadId: string; subject?: string; scheduledAt: string; lead: { firstName: string; lastName: string } }>
  recentActivity: LeadActivity[]
}

export interface AgencyDashboard {
  pipeline: Array<{ status: string; count: number }>
  bySource: Record<string, number>
  byPriority: Record<string, number>
  brokerPerformance: Array<{ id: string; firstName: string; lastName: string; assigned: number; converted: number; active: number }>
  monthlyTrend: Array<{ month: string; count: number }>
  propertySummary: { total: number; byStatus: Record<string, number> }
  conversionRate: number
  totalLeads: number
  activeLeads: number
  convertedLeads: number
}

export interface SuperAdminDashboard {
  totalAgencies: number
  totalUsers: number
  totalLeads: number
  conversionRate: number
  agencies: Array<{ id: string; name: string; leadCount: number; userCount: number; createdAt: string }>
  recentAgencies: Array<{ id: string; name: string; createdAt: string }>
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message?: string
  link?: string
  isRead: boolean
  createdAt: string
}
