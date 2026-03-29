import bcrypt from 'bcrypt';
import { pool } from '@/lib/db';
import type { Role } from '@/lib/types';

export type DbUser = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: Role;
  manager_id: string | null;
  manager_name: string | null;
  created_at: string;
};

export async function listUsersForCompany(companyId: string) {
  const { rows } = await pool.query<DbUser>(
    `
      SELECT
        u.id, u.company_id, u.name, u.email, u.role, u.manager_id,
        m.name AS manager_name,
        u.created_at::text
      FROM users u
      LEFT JOIN users m ON m.id = u.manager_id
      WHERE u.company_id = $1
      ORDER BY u.created_at ASC
    `,
    [companyId],
  );
  return rows;
}

export async function getUserById(userId: string, companyId: string) {
  const { rows } = await pool.query<DbUser>(
    `
      SELECT
        u.id, u.company_id, u.name, u.email, u.role, u.manager_id,
        m.name AS manager_name,
        u.created_at::text
      FROM users u
      LEFT JOIN users m ON m.id = u.manager_id
      WHERE u.id = $1 AND u.company_id = $2
      LIMIT 1
    `,
    [userId, companyId],
  );
  return rows[0] ?? null;
}

export async function createUser(
  companyId: string,
  data: { name: string; email: string; temporaryPassword: string; role: Role; managerId?: string | null },
) {
  const passwordHash = await bcrypt.hash(data.temporaryPassword, 12);

  const { rows } = await pool.query<{ id: string }>(
    `
      INSERT INTO users (company_id, name, email, password_hash, role, manager_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [companyId, data.name, data.email, passwordHash, data.role, data.managerId ?? null],
  );

  return rows[0];
}

export async function updateUser(
  userId: string,
  companyId: string,
  data: { name?: string; role?: Role; managerId?: string | null },
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.role !== undefined) {
    sets.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (data.managerId !== undefined) {
    sets.push(`manager_id = $${paramIndex++}`);
    values.push(data.managerId);
  }

  if (sets.length === 0) return null;

  values.push(userId, companyId);

  const { rows } = await pool.query<{ id: string }>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramIndex++} AND company_id = $${paramIndex} RETURNING id`,
    values,
  );

  return rows[0] ?? null;
}

export async function deleteUser(userId: string, companyId: string) {
  const { rowCount } = await pool.query(
    `DELETE FROM users WHERE id = $1 AND company_id = $2`,
    [userId, companyId],
  );
  return (rowCount ?? 0) > 0;
}

export async function listManagersForCompany(companyId: string) {
  const { rows } = await pool.query<{ id: string; name: string; email: string }>(
    `
      SELECT id, name, email
      FROM users
      WHERE company_id = $1 AND role IN ('manager', 'admin')
      ORDER BY name ASC
    `,
    [companyId],
  );
  return rows;
}
