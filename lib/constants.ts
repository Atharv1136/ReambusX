export const ROLES = ['admin', 'manager', 'employee'] as const;

export const EXPENSE_STATUSES = ['draft', 'pending', 'approved', 'rejected'] as const;

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Food',
  'Office Supplies',
  'Medical',
  'Miscellaneous',
] as const;

export const NAV_LINKS = {
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard' },
    { href: '/dashboard/admin/users', label: 'Users' },
    { href: '/dashboard/admin/approval-rules', label: 'Approval Rules' },
    { href: '/dashboard/admin/expenses', label: 'All Expenses' },
    { href: '/dashboard/admin/settings', label: 'Settings' },
  ],
  manager: [
    { href: '/dashboard/manager', label: 'Dashboard' },
    { href: '/dashboard/manager/approvals', label: 'My Approvals' },
    { href: '/dashboard/manager/team', label: 'Team Expenses' },
  ],
  employee: [
    { href: '/dashboard/employee', label: 'Dashboard' },
    { href: '/dashboard/employee/expenses', label: 'My Expenses' },
    { href: '/dashboard/employee/submit', label: 'Submit Expense' },
  ],
} as const;

export const COOKIE_NAME = 'session';
export const DEFAULT_JWT_EXPIRES_IN = '1d';
