import type { Lead, LeadStatus, LeadSource, LeadPriority } from '../types'

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  OTHER: 'Other',
}

const PRIORITY_LABELS: Record<LeadPriority, string> = {
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
}

const budgetFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

interface LeadShareData {
  firstName: string
  lastName: string
  phone?: string | null
  email?: string | null
  status: LeadStatus
  priority: LeadPriority
  source: LeadSource
  budgetMin?: number | null
  budgetMax?: number | null
  preferredLocation?: string | null
  propertyTypePreference?: string | null
  notes?: string | null
}

export function generateWhatsAppLink(
  lead: LeadShareData,
  agencyName?: string,
): string {
  const lines: string[] = []

  lines.push(`*Lead Details — ${agencyName || 'RealtyNest'}*`)
  lines.push('')

  lines.push(`Name: ${lead.firstName} ${lead.lastName}`)
  if (lead.phone) lines.push(`Phone: ${lead.phone}`)
  if (lead.email) lines.push(`Email: ${lead.email}`)
  lines.push(`Status: ${STATUS_LABELS[lead.status]}`)
  lines.push(`Priority: ${PRIORITY_LABELS[lead.priority]}`)
  lines.push(`Source: ${SOURCE_LABELS[lead.source]}`)

  if (lead.budgetMin != null || lead.budgetMax != null) {
    if (lead.budgetMin != null && lead.budgetMax != null) {
      lines.push(`Budget: ${budgetFmt.format(lead.budgetMin)} - ${budgetFmt.format(lead.budgetMax)}`)
    } else if (lead.budgetMin != null) {
      lines.push(`Budget: From ${budgetFmt.format(lead.budgetMin)}`)
    } else {
      lines.push(`Budget: Up to ${budgetFmt.format(lead.budgetMax!)}`)
    }
  }

  if (lead.preferredLocation) lines.push(`Location: ${lead.preferredLocation}`)
  if (lead.propertyTypePreference) lines.push(`Property Preference: ${lead.propertyTypePreference}`)

  if (lead.notes) {
    lines.push('')
    lines.push(`Notes: ${lead.notes}`)
  }

  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
}

/** Minimal version for list rows where only a few fields are available */
export function generateWhatsAppLinkFromRow(
  lead: Pick<Lead, 'firstName' | 'lastName' | 'phone' | 'email' | 'status' | 'priority' | 'source'>,
  agencyName?: string,
): string {
  return generateWhatsAppLink(lead as LeadShareData, agencyName)
}
