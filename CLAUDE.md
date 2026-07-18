่# Personal Finance App

Full-stack personal finance web application. Built for personal use.

## Stack

- **Frontend** — Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Zustand, Recharts
- **Backend** — NestJS, Prisma ORM, PostgreSQL
- **Auth** — Better Auth (email + password)
- **Deploy** — Docker + docker-compose

## Project Structure

```
personal-finance/
├── backend/          # NestJS API (port 4000)
│   ├── prisma/       # Schema + migrations
│   └── src/
│       ├── auth/
│       ├── accounts/
│       ├── categories/
│       ├── transactions/
│       ├── budgets/
│       ├── reports/
│       └── users/
├── frontend/         # Next.js app (port 3000)
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── store/
│       └── types/
└── docker-compose.yml
```

## Dev Setup

```bash
# 1. Start PostgreSQL
docker-compose up postgres -d

# 2. Backend
cd backend
cp .env.example .env   # fill in secrets
npm install
npx prisma migrate dev
npm run start:dev

# 3. Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Run Everything with Docker

```bash
cp .env.example .env   # fill in secrets
docker-compose up --build
```

## URLs

| Service   | URL                    |
|-----------|------------------------|
| Frontend  | http://localhost:3000  |
| Backend   | http://localhost:4000  |
| DB Studio | npx prisma studio      |

## Hard Rules

- No `any` type in TypeScript
- Amount must always be > 0
- Every API route is protected by AuthGuard
- Balance updates always run inside Prisma transactions
- Do not add features beyond Version 1 scope until explicitly asked
