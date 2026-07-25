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

## Deployment & Data Safety

- **Railway hobby plan ไม่มี automatic backup** — ถ้า DB ถูก recreate ข้อมูลหายถาวร
- ทุกครั้งที่ setup หรือแนะนำการ deploy บน cloud ต้องแจ้งเรื่องนี้ก่อนเสมอ
- ต้องมี export/backup mechanism ก่อน go live เสมอ
- ข้อมูลที่หายแล้วกู้คืนไม่ได้ถ้าไม่มี backup

## Automated Backup

- GitHub Actions รัน backup อัตโนมัติ: **ทุกวัน 02:00** + **ทุกครั้งที่ push to main**
- Backup เก็บใน GitHub Actions Artifacts **90 วัน**
- ดาวน์โหลด backup: GitHub repo → Actions → เลือก workflow run → Artifacts
- Restore: `psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql`
- Secret ที่ต้องตั้งใน GitHub: `RAILWAY_DATABASE_URL`, `RAILWAY_BACKEND_URL`

## Deploy Checklist

ทุกครั้งที่ push to main ให้เช็คหลัง deploy เสร็จ (~2 นาที):

- [ ] Login ได้
- [ ] หน้า Dashboard โหลด Net Worth ถูกต้อง
- [ ] หน้า บัญชี เห็นข้อมูล
- [ ] หน้า รายการ เห็นข้อมูล
- [ ] หน้า ลงทุน เห็น holdings
- [ ] Export CSV ยังมีปุ่มอยู่
- [ ] GitHub Actions backup workflow ผ่าน ✅
