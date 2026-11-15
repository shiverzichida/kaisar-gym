# Notes & Checklist Keamanan yang Belum Dilakukan

Daftar tindak lanjut yang masih perlu dieksekusi di infrastruktur/server maupun sebelum rilis produksi penuh.

---

## 1. Rotasi Password DB & `JWT_SECRET` (Prioritas Tinggi)

- [ ] **Generate password DB & `JWT_SECRET` baru**
  ```bash
  # Password DB (hex, aman untuk connection string URL)
  node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

  # JWT_SECRET baru
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **Ubah password user `kaisar` di PostgreSQL (`43.173.33.53:5433`)**
  ```sql
  ALTER USER kaisar WITH PASSWORD 'PASSWORD_DB_BARU_ANDA';
  ```
  *(Atau via SSH VPS: `sudo -u postgres psql -p 5433 -c "ALTER USER kaisar WITH PASSWORD 'PASSWORD_DB_BARU_ANDA';"` atau `docker exec -it <container_postgres> psql -U postgres -c "..."`)*
- [ ] **Update `.env` produksi & env deployment (Docker / Vercel)**
  ```env
  DATABASE_URL="postgresql://kaisar:PASSWORD_DB_BARU_ANDA@43.173.33.53:5433/postgres?schema=kaisar"
  DIRECT_URL="postgresql://kaisar:PASSWORD_DB_BARU_ANDA@43.173.33.53:5433/postgres?schema=kaisar"
  JWT_SECRET="JWT_SECRET_BARU_ANDA"
  ```
- [ ] **Restart backend & cek log**
  ```bash
  docker compose up -d --force-recreate backend
  # atau jika memakai PM2:
  pm2 restart kaisar-gym-backend --update-env
  ```
- [ ] **(Jika repo pernah di-push ke GitHub/remote)** Bersihkan riwayat git untuk `.env.example` lama yang sempat menyimpan kredensial asli.

---

## 2. Hardening Jaringan & Environment Produksi

- [ ] **Batasi akses firewall port `5433` (PostgreSQL)** agar hanya IP server aplikasi / IP admin yang bisa mengakses (tidak terbuka ke `0.0.0.0/0`).
- [ ] **Set `CORS_ORIGINS`** di env backend produksi ke domain resmi `frontend` & `portal` (contoh: `https://app.kaisargym.com,https://portal-kaisar.43-173-33-53.sslip.io`).
- [ ] **Set `ALLOW_DEMO_LOGIN=false`** di env backend ketika sudah siap menonaktifkan quick demo login backoffice.

---

## 3. Patch Dependensi (`npm audit`)

- [ ] **Upgrade `next`** di `frontend/` dan `portal/` untuk menutup CVE Critical & High pada `next@14.2.35`, lalu uji `npm run build` di kedua app.
- [ ] **Jalankan `npm audit fix`** di `backend/` untuk menutup kerentanan dependensi produksi (12 vulnerabilities saat audit terakhir).

---

## 4. Pengamanan Endpoint Setelah Masa Demo Selesai

- [ ] **Aktifkan `JwtAuthGuard` + `RolesGuard`** pada endpoint backoffice (`members`, `pos`, `finance`, `trainers`, `groups`, `classes`) di `backend`.
- [ ] **Ganti login demo `portal`** (`portal/src/app/login/page.tsx`) dengan autentikasi berbasis PIN/password yang diverifikasi server saat masa demo sementara sudah selesai.
