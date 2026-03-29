import type {
  APPROVAL_STATUSES,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  ROLES,
} from '@/lib/constants';

export type Role = (typeof ROLES)[number];

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type SessionUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
  managerId?: string | null;
};

export type SessionPayload = SessionUser & {
  expiresAt: number;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
