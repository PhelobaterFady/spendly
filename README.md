# Spendly — Personal Finance Tracker

## Overview

Full-stack expense and personal finance tracker. The user manages expenses, income,
wallets, installment plans, savings goals, and a monthly budget through a React +
Tailwind UI backed by an Express API and a Sequelize-managed SQL database.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **Backend** (`artifacts/api-server`): Express 5, Sequelize 6 (Postgres dialect via
  `DATABASE_URL`, MySQL fallback via `MYSQL_URL`), JWT auth (`jsonwebtoken` +
  `bcryptjs`), Pino logging, esbuild bundle
- **Frontend** (`artifacts/expense-tracker`): React + Vite, Tailwind v4, wouter,
  TanStack Query, Recharts (pie + 6-month bar chart), sonner toasts, lucide-react
- **Shared**: Mockup sandbox at `artifacts/mockup-sandbox` for design previews

## Database schema

Tables (auto-created/migrated by `sequelize.sync({ alter: true })`):

- `users` — id, username, email, password (bcrypt hash), monthly_budget
- `payment_methods` — wallets/cards (Cash, Credit Card, Vodafone Cash, …) with
  per-wallet running balance
- `expenses` — amount, category enum (Food/Rent/Tech/Transport/Others), date,
  description, optional FK → payment_methods
- `income` — amount, source, date, description, optional FK → payment_methods
- `installments` — item_name, total_amount, monthly_payment, remaining_amount,
  optional FK → payment_methods
- `savings_goals` — name, target_amount, current_amount

Reference DDL (Postgres + MySQL variant) lives in `schema.sql` at repo root.

## Business rules

- Adding/deleting expenses or income automatically updates the linked wallet balance.
- "Pay this month" on an installment creates an Expense (category Others), debits the
  linked wallet, and decrements `remaining_amount` (clamped to zero).
- Goals support contributions (positive) and withdrawals (negative), clamped to ≥ 0.
- Dashboard summary computes Net Balance (Total Income − Total Expenses), Monthly
  Spend, Top Category, per-category breakdown, and a 6-month income-vs-expenses trend.

## Routes

- `POST /api/auth/signup` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET/POST/DELETE /api/expenses` · `GET/POST/DELETE /api/income`
- `GET/POST/PUT/DELETE /api/payment-methods`
- `GET/POST/DELETE /api/installments` · `POST /api/installments/:id/pay`
- `GET/POST/DELETE /api/goals` · `POST /api/goals/:id/contribute`
- `GET/PUT /api/budget` · `GET /api/dashboard/summary`

## Env vars / secrets

- `DATABASE_URL` (Replit Postgres, preferred) **or** `MYSQL_URL`
- `JWT_SECRET` — signing key for auth tokens
- `SESSION_SECRET` — reserved (not currently used)

## Frontend pages

`/login`, `/` (Dashboard), `/transactions`, `/income`, `/wallets`, `/installments`,
`/goals`, `/budget`. Dark mode toggle in the sidebar; theme persists in
`localStorage`. Toast notifications via sonner on every mutation.

## Key commands

- `pnpm --filter @workspace/api-server run dev` — run the API
- `pnpm --filter @workspace/expense-tracker run dev` — run the web app
- `pnpm install` — install workspace dependencies
