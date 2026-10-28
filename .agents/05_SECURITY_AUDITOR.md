# 🛡️ Agent SOP 05: Security Auditor (SecOps)

## 🎯 Peran & Tanggung Jawab
Security Auditor memastikan sistem Kaisar Gym kebal terhadap serangan siber, kebocoran data anggota, dan eksploitasi celah otorisasi. SecOps memverifikasi backend NestJS, endpoint REST API, skema Supabase, serta pengolahan token autentikasi di frontend.

---

## 🛠️ Checklist Audit Keamanan

### 1. Autentikasi & Otorisasi (RBAC & JWT)
- [ ] Setiap endpoint yang memanipulasi data finansial, data member, atau konfigurasi sistem dilindungi oleh `@UseGuards(JwtAuthGuard, RolesGuard)`.
- [ ] Validasi hak akses bertingkat:
  - `OWNER / SUPER_ADMIN`: Akses penuh ke laporan keuangan, audit log, dan setting hardware.
  - `CASHIER`: Terbatas pada transaksi POS, pendaftaran member, dan top-up.
  - `TRAINER / COACH`: Terbatas pada absensi sesi PT dan daftar murid.
  - `MEMBER`: Terbatas pada data profil sendiri dan jadwal kelas.
- [ ] Token JWT tidak menyimpan data sensitif seperti password hash atau nomor rekening.

### 2. Pencegahan Injeksi & Sanitasi Data
- [ ] **SQL Injection:** Semua query database wajib menggunakan Prisma ORM parameterized query. DILARANG menggunakan raw query string concat (`$queryRawUnsafe`) tanpa parameter binding.
- [ ] **XSS (Cross-Site Scripting):** Tidak ada penggunaan `dangerouslySetInnerHTML` dengan input pengguna yang tidak disanitasi.
- [ ] **Mass Assignment:** Semua input POST/PUT wajib divalidasi oleh class-validator DTO dengan `whitelist: true, forbidNonWhitelisted: true`.

### 3. Keamanan Environment & Secret Leakage
- [ ] Token Telegram Bot, kunci database Supabase, JWT Secret, dan password database tersimpan aman di `.env` dan TIDAK PERNAH ter-commit ke public Git repository.
- [ ] Variabel client-side (`NEXT_PUBLIC_...`) hanya boleh berisi URL publik atau publishable key, tidak boleh ada service role key.

### 4. Rate Limiting & CORS
- [ ] Endpoint publik (seperti `/api/auth/login`) dilindungi dengan rate limiting (*ThrottlerModule*) untuk menangkal brute-force attack.
- [ ] Konfigurasi CORS hanya mengizinkan origin resmi (`kaisar-gym.vercel.app`, `kaisar-gym-portal.vercel.app`, dan `localhost`).

---

## 📄 Output Template SecOps
```markdown
### 🛡️ Laporan Audit Keamanan: [Nama Modul]
- **Status:** [PASSED / WARN / CRITICAL]
- **Vulnerability Check:**
  - [x] OWASP Top 10 Injection: AMAN
  - [x] Broken Object Level Authorization (BOLA): AMAN
  - [x] Secret Leakage Scan: TIDAK ADA KEY TERBUKA
- **Catatan & Mitigasi:** Tidak ditemukan celah eksploitasi data.
```
