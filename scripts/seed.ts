import { pool } from '../lib/db';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');
  
  // 1. Create Companies Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      currency_symbol TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. Create Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK (role IN ('admin', 'manager', 'employee')) DEFAULT 'employee',
      manager_id UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. Create Approval Rules Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      min_amount NUMERIC,
      max_amount NUMERIC,
      is_manager_approver BOOLEAN DEFAULT FALSE,
      minimum_approval_percentage NUMERIC,
      specific_approver_id UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 4. Create Approval Rule Steps Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_rule_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rule_id UUID REFERENCES approval_rules(id) ON DELETE CASCADE,
      approver_id UUID REFERENCES users(id),
      step_order INT NOT NULL,
      is_required BOOLEAN DEFAULT TRUE
    );
  `);

  // 5. Create Expenses Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      submitted_by UUID REFERENCES users(id),
      category TEXT NOT NULL,
      description TEXT,
      amount NUMERIC NOT NULL,
      currency_code TEXT NOT NULL,
      amount_in_company_currency NUMERIC,
      expense_date DATE NOT NULL,
      receipt_url TEXT,
      ocr_data JSONB,
      status TEXT CHECK (status IN ('draft','pending','approved','rejected')) DEFAULT 'draft',
      current_step INT DEFAULT 1,
      rule_id UUID REFERENCES approval_rules(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 6. Create Expense Approvals Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expense_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
      approver_id UUID REFERENCES users(id),
      step_order INT NOT NULL,
      status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
      comment TEXT,
      actioned_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add indexes for performance
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_company_status ON expenses(company_id, status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses(submitted_by)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver ON expense_approvals(approver_id, status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id)`);

  console.log('Tables and indexes created. Checking for existing company...');

  // Seed Data: Acme Corp
  const companyRes = await pool.query('SELECT * FROM companies WHERE name = $1', ['Acme Corp']);
  let companyId;
  
  if (companyRes.rowCount === 0) {
    const insertCompany = await pool.query(`
      INSERT INTO companies (name, country, currency_code, currency_symbol)
      VALUES ('Acme Corp', 'India', 'INR', '₹') RETURNING id;
    `);
    companyId = insertCompany.rows[0].id;
    console.log('Created Company: Acme Corp');
  } else {
    companyId = companyRes.rows[0].id;
  }

  // Passwords
  const hash = await bcrypt.hash('Password123', 12);

  // Users
  const users = [
    { email: 'admin@acme.com', name: 'Admin User', role: 'admin', managerEmail: null },
    { email: 'sarah@acme.com', name: 'Sarah', role: 'manager', managerEmail: null },
    { email: 'mitchell@acme.com', name: 'Mitchell', role: 'manager', managerEmail: null },
    { email: 'john@acme.com', name: 'John', role: 'employee', managerEmail: 'sarah@acme.com' },
    { email: 'alice@acme.com', name: 'Alice', role: 'employee', managerEmail: 'mitchell@acme.com' },
    { email: 'bob@acme.com', name: 'Bob', role: 'employee', managerEmail: null }
  ];

  const emailToId: Record<string, string> = {};

  // Insert users without managers first
  for (const u of users) {
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (res.rowCount === 0) {
      const insertUser = await pool.query(`
        INSERT INTO users (company_id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5) RETURNING id;
      `, [companyId, u.name, u.email, hash, u.role]);
      emailToId[u.email] = insertUser.rows[0].id;
      console.log(`Created User: ${u.name}`);
    } else {
      emailToId[u.email] = res.rows[0].id;
    }
  }

  // Update managers
  for (const u of users) {
    if (u.managerEmail && emailToId[u.managerEmail]) {
      await pool.query('UPDATE users SET manager_id = $1 WHERE email = $2', [
        emailToId[u.managerEmail], u.email
      ]);
    }
  }

  console.log('Seeding Database complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
