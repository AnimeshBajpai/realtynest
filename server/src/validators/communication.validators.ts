import { z } from 'zod';

const communicationTypeValues = ['CALL', 'MEETING', 'EMAIL', 'SMS', 'NOTE'] as const;

export const createCommunicationSchema = z.object({
  type: z.enum(communicationTypeValues, { message: 'Invalid communication type' }),
  subject: z.string().optional(),
  body: z.string().optional(),
  outcome: z.string().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateCommunicationSchema = z.object({
  type: z.enum(communicationTypeValues).optional(),
  subject: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const communicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  type: z.enum(communicationTypeValues).optional(),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;
export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>;
export type CommunicationQueryInput = z.infer<typeof communicationQuerySchema>;
