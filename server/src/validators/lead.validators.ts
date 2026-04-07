import { z } from 'zod';

const leadSourceValues = [
  'WALK_IN',
  'PHONE',
  'WEBSITE',
  'REFERRAL',
  'SOCIAL_MEDIA',
  'OTHER',
] as const;

const leadStatusValues = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'SITE_VISIT',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

const leadPriorityValues = ['HOT', 'WARM', 'COLD'] as const;

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.enum(leadSourceValues).optional(),
  status: z.enum(leadStatusValues).optional(),
  priority: z.enum(leadPriorityValues).optional(),
  budgetMin: z.number().min(0).optional().nullable(),
  budgetMax: z.number().min(0).optional().nullable(),
  preferredLocation: z.string().optional(),
  propertyTypePreference: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().uuid('Invalid assignedToId').optional().nullable(),
});

export const updateLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.enum(leadSourceValues).optional(),
  status: z.enum(leadStatusValues).optional(),
  priority: z.enum(leadPriorityValues).optional(),
  budgetMin: z.number().min(0).optional().nullable(),
  budgetMax: z.number().min(0).optional().nullable(),
  preferredLocation: z.string().optional().nullable(),
  propertyTypePreference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().uuid('Invalid assignedToId').optional().nullable(),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: z.enum(leadStatusValues).optional(),
  source: z.enum(leadSourceValues).optional(),
  priority: z.enum(leadPriorityValues).optional(),
  assignedToId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'status', 'priority'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(leadStatusValues, { message: 'Invalid lead status' }),
});

export const assignLeadSchema = z.object({
  assignedToId: z.string().uuid('Invalid assignedToId'),
});

export const bulkAssignSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
  assignedToId: z.string(),
});

export const bulkStatusSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
  status: z.enum(leadStatusValues, { message: 'Invalid lead status' }),
});

export const bulkDeleteSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
