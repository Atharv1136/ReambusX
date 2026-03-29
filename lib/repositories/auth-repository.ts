import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '@/lib/db';
import type { Role, SessionUser } from '@/lib/types';

export type DbUser = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  manager_id: string | null;
};

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query<DbUser>(
    `
      SELECT id, company_id, name, email, password_hash, role, manager_id
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createCompanyWithAdmin(input: {
  companyName: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  fullName: string;
  email: string;
  password: string;
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: companyRows } = await client.query<{ id: string }>(
      `
        INSERT INTO companies (name, country, currency_code, currency_symbol)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [input.companyName, input.country, input.currencyCode, input.currencySymbol],
    );

    const passwordHash = await bcrypt.hash(input.password, 12);
    const companyId = companyRows[0].id;

    const { rows: userRows } = await client.query<DbUser>(
      `
        INSERT INTO users (company_id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, 'admin')
        RETURNING id, company_id, name, email, password_hash, role, manager_id
      `,
      [companyId, input.fullName, input.email, passwordHash],
    );

    await client.query('COMMIT');

    return toSessionUser(userRows[0]);
  } catch (error) {
    await rollbackSafe(client);
    throw error;
  } finally {
    client.release();
  }
}

export function toSessionUser(dbUser: Pick<DbUser, 'id' | 'company_id' | 'name' | 'email' | 'role' | 'manager_id'>): SessionUser {
  return {
    id: dbUser.id,
    companyId: dbUser.company_id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    managerId: dbUser.manager_id,
  };
}

async function rollbackSafe(client: PoolClient) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Best effort rollback for transaction cleanup.
  }
}
