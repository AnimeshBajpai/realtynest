import { z } from 'zod';

const propertyTypeValues = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL'] as const;
const propertyStatusValues = ['AVAILABLE', 'SOLD', 'RESERVED'] as const;
const interestLevelValues = ['HIGH', 'MEDIUM', 'LOW'] as const;

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  type: z.enum(propertyTypeValues, { message: 'Invalid property type' }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  areaSqft: z.number().min(0).optional().nullable(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  status: z.enum(propertyStatusValues).optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional().nullable(),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').optional(),
  type: z.enum(propertyTypeValues).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  areaSqft: z.number().min(0).optional().nullable(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  status: z.enum(propertyStatusValues).optional(),
  description: z.string().optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
});

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  type: z.enum(propertyTypeValues).optional(),
  status: z.enum(propertyStatusValues).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  city: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'price', 'areaSqft', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const linkLeadSchema = z.object({
  leadId: z.string().uuid('Invalid leadId'),
  interestLevel: z.enum(interestLevelValues).optional(),
  notes: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyQueryInput = z.infer<typeof propertyQuerySchema>;
export type LinkLeadInput = z.infer<typeof linkLeadSchema>;
