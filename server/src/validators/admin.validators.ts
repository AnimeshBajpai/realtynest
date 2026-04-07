import { z } from 'zod';

export const createAgencySchema = z.object({
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters'),
  adminEmail: z.email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
  adminPhone: z.string().min(10, 'Phone number is required'),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
