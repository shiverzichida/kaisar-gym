@echo off
echo ========================================================
echo   KAISAR GYM ECOSYSTEM - LOCALHOST LAUNCHER
echo ========================================================
start "Kaisar Gym - PostgreSQL (Port 5432)" cmd /k "npm run db:start"
timeout /t 4 /nobreak >nul
start "Kaisar Gym - NestJS Backend (Port 4000)" cmd /k "npm run dev:backend"
start "Kaisar Gym - Next.js Frontend (Port 3000)" cmd /k "npm run dev:frontend"
echo Semua layanan sedang dijalankan! Buka http://localhost:3000 di browser.
