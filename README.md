<p align="center">
	<img src="./public/reambusx-logo.svg" alt="ReambusX logo" width="900" />
</p>

<p align="center">
	<strong>ReambusX</strong> is a full-stack expense reimbursement management platform built for modern teams.
</p>

<p align="center">
	Multi-level approvals • OCR receipts • Multi-currency conversion • Role-based workflows
</p>

---

## Overview

ReambusX is a dark-themed enterprise SaaS application for expense reimbursement management.

It supports:

- Company onboarding with auto currency setup
- Role-based access (`admin`, `manager`, `employee`)
- JWT auth via `httpOnly` cookies
- Approval rule engine foundations
- Neon Postgres integration
- Country and exchange rate proxy APIs

## Brand and Design

- Primary background: `#0D1117`
- Accent blue: `#3B82F6` to `#60A5FA`
- Accent orange: `#F59E0B` to `#FB923C`
- Text primary: `#FFFFFF`
- Text secondary: `#94A3B8`

Global theme tokens are defined in [app/globals.css](app/globals.css).

## Tech Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript
- Styling: Tailwind CSS v4
- Backend: Next.js Route Handlers (`app/api`)
- Database: Neon Postgres (`pg`)
- Auth: JWT (`jose`) + `httpOnly` cookie session
- Password hashing: `bcrypt`
- OCR engine: `tesseract.js` (endpoint scaffolding ready)
- Forms/validation: `react-hook-form`, `zod`

## Current App Modules

### Public + Auth

- Landing page: [app/page.tsx](app/page.tsx)
- Sign up: [app/signup/page.tsx](app/signup/page.tsx)
- Login: [app/login/page.tsx](app/login/page.tsx)

### Dashboards (Role Surfaces)

- Admin dashboard + placeholders:
	- [app/dashboard/admin/page.tsx](app/dashboard/admin/page.tsx)
	- [app/dashboard/admin/users/page.tsx](app/dashboard/admin/users/page.tsx)
	- [app/dashboard/admin/approval-rules/page.tsx](app/dashboard/admin/approval-rules/page.tsx)
	- [app/dashboard/admin/expenses/page.tsx](app/dashboard/admin/expenses/page.tsx)
- Manager dashboard + approvals/team pages
- Employee dashboard + submit/history pages

### API Routes (Implemented)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/countries`
- `GET /api/exchange-rate/:base`

### Core Library Modules

- Auth/session: [lib/auth.ts](lib/auth.ts), [lib/session-token.ts](lib/session-token.ts)
- Role guards: [lib/auth-guards.ts](lib/auth-guards.ts)
- DB layer: [lib/db.ts](lib/db.ts)
- Validation: [lib/validators.ts](lib/validators.ts)
- Error handling: [lib/http.ts](lib/http.ts)
- Domain constants/types: [lib/constants.ts](lib/constants.ts), [lib/types.ts](lib/types.ts)

## Database (Neon)

### Required Environment Variables

Create `.env.local`:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=verify-full"
JWT_SECRET="replace-with-strong-secret"
JWT_EXPIRES_IN="1d"
UPLOAD_DIR="uploads"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
```

If `OPENAI_API_KEY` is set, OCR uses OpenAI to generate a higher-quality structured description, category, date, amount, and currency from extracted receipt text. If not set, the app automatically falls back to regex-based parsing.

Reference template: [.env.example](.env.example)

### Seed Database

```bash
# PowerShell (loads .env.local into current shell then seeds)
Get-Content .env.local | ForEach-Object {
	if ($_ -match '^\s*([^#=]+)=(.*)$') {
		$name=$matches[1].Trim()
		$value=$matches[2].Trim().Trim('"')
		Set-Item -Path Env:$name -Value $value
	}
}

npx tsx scripts/seed.ts
```

Seed script: [scripts/seed.ts](scripts/seed.ts)

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Quality Checks

```bash
npm run lint
npm run build
```

## Auth and Access Control

- Session cookie name: `session`
- Cookie mode: `httpOnly`, `sameSite=lax`, `secure` in production
- Route protection currently handled in [middleware.ts](middleware.ts)

Note: Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. Migration is planned.

## Project Structure

```text
app/
	api/
	dashboard/
	login/
	signup/
components/
	auth/
	ui/
lib/
	repositories/
scripts/
public/
```

## Roadmap

The repository currently contains strong foundations and scaffolding. The following features are next for full production completeness:

- Full approval rule builder CRUD and sequence drag-drop persistence
- Complete expense submission + OCR extraction endpoint
- Approval workflow engine execution for approve/reject transitions
- Manager queue actions and timeline views
- Admin override flow and complete expense filters
- File upload storage endpoint + receipt preview pipeline

## Troubleshooting

### Hydration warning with extra body attributes

If you see hydration mismatch caused by browser extensions injecting attributes, root layout already includes `suppressHydrationWarning` on `html` and `body` in [app/layout.tsx](app/layout.tsx).

### Database connection refuses localhost

Ensure environment variables are loaded before running scripts; otherwise `pg` may fallback to local defaults.

## Contributing

1. Create a feature branch.
2. Keep commits scoped and descriptive.
3. Run lint/build before PR.
4. Add/update docs when behavior changes.

## License

Internal project for ReambusX by AntiGravity.
