# 🏛️ Kaisar Gym Autonomous Agentic Software Engineering Pipeline

Sistem ini menjalankan tim multi-agent otonom yang bekerja bersama-sama secara berurutan (*sequential pipeline with feedback gates*) untuk mengeksekusi instruksi dari Telegram atau CLI langsung ke aplikasi Kaisar Gym (POS Kasir, Portal Member, Backend NestJS, Database Supabase, dan Cloud Deployment).

---

## 👥 Struktur Tim 6-Agent

```
                ┌─────────────────────────────────────────┐
                │   User Command (Telegram / Dashboard)   │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │  Gate 1: Product Manager (Requirements) │
                │  - Uraikan instruksi jadi PRD & Stories │
                │  - Tentukan Acceptance Criteria         │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │  Gate 2: System Architect               │
                │  - Skema database (Prisma / SQL)        │
                │  - REST API contracts & DTOs            │
                │  - Integrasi MCP & service boundaries   │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │  Gate 3: UI/UX Integrator & Programmer  │
                │  - Implementasi Frontend & Backend      │
                │  - Tailwind styling, Anti-Slop layout   │
                │  - Responsif & mikro-interaksi          │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │  Gate 4: Code Reviewer & Refactorer     │
                │  - Clean code, no dead code             │
                │  - Modularitas & strict TypeScript      │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │  Gate 5: Security Auditor (SecOps)      │
                │  - Cek RBAC, JWT, OWASP, SQL/ORM safety │
                │  - Sanitasi input & otorisasi endpoint  │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │  Gate 6: DevOps & QA Engineer           │
                │  - Build check (npm run build)          │
                │  - Playwright visual verification       │
                │  - Git commit & push ke Vercel Cloud    │
                │  - Kirim laporan & screenshot ke TG Bot │
                └─────────────────────────────────────────┘
```

---

## 📋 Daftar SOP Agent

1. [`01_PRODUCT_MANAGER.md`](./01_PRODUCT_MANAGER.md) — Pembuatan spesifikasi, alur user, acceptance criteria.
2. [`02_SYSTEM_ARCHITECT.md`](./02_SYSTEM_ARCHITECT.md) — Perancangan skema database, arsitektur REST API, dan integrasi MCP.
3. [`03_UI_UX_INTEGRATOR.md`](./03_UI_UX_INTEGRATOR.md) — Standar antarmuka mobile/desktop, Tailwind styling, Anti-Slop, dan mikro-interaksi.
4. [`04_CODE_REVIEWER.md`](./04_CODE_REVIEWER.md) — Verifikasi clean code, modularitas, dan refactoring.
5. [`05_SECURITY_AUDITOR.md`](./05_SECURITY_AUDITOR.md) — Audit keamanan endpoint, otentikasi JWT, RBAC, dan pencegahan injeksi.
6. [`06_DEVOPS_ENGINEER.md`](./06_DEVOPS_ENGINEER.md) — Otomasi build, pengujian visual Playwright, deployment Vercel, dan notifikasi Telegram.
