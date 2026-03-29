import { z } from 'zod';
import { EXPENSE_CATEGORIES, ROLES } from '@/lib/constants';

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
});

export const signupSchema = z
  .object({
    companyName: z.string().min(2).max(120),
    country: z.string().min(2).max(120),
    currencyCode: z.string().length(3).transform((v) => v.toUpperCase()),
    currencySymbol: z.string().min(1).max(8),
    fullName: z.string().min(2).max(120),
    email: z.string().email().transform((v) => v.toLowerCase().trim()),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const userCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  temporaryPassword: z.string().min(8).max(128),
  role: z.enum(ROLES),
  managerId: z.string().uuid().nullable().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(ROLES).optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export const approvalStepSchema = z.object({
  approverId: z.string().uuid(),
  stepOrder: z.number().int().positive(),
  isRequired: z.boolean().default(true),
});

export const approvalRuleSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.union([z.enum(EXPENSE_CATEGORIES), z.literal('All')]).nullable().optional(),
  minAmount: z.number().nonnegative().nullable().optional(),
  maxAmount: z.number().nonnegative().nullable().optional(),
  isManagerApprover: z.boolean().default(false),
  minimumApprovalPercentage: z.number().positive().max(100).nullable().optional(),
  specificApproverId: z.string().uuid().nullable().optional(),
  steps: z.array(approvalStepSchema),
});

export const expenseCreateSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().max(2000).nullable().optional(),
  amount: z.number().positive(),
  currencyCode: z.string().length(3).transform((v) => v.toUpperCase()),
  expenseDate: z.string().date(),
  receiptUrl: z.string().url().nullable().optional(),
  ocrData: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const expenseActionSchema = z.object({
  comment: z.string().max(1000).nullable().optional(),
});

export const adminOverrideSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().max(1000).nullable().optional(),
});
