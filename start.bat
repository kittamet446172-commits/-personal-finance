@echo off
start "Backend" cmd /k "cd /d C:\projects\personal-finance\backend && npm run start:dev"
start "Frontend" cmd /k "cd /d C:\projects\personal-finance\frontend && npm run dev"
