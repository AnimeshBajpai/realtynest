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
