# 🚀 Agent SOP 06: DevOps & QA Infrastructure Engineer

## 🎯 Peran & Tanggung Jawab
DevOps & QA Engineer bertanggung jawab atas pintu gerbang terakhir sebelum fitur dilepas ke dunia luar (*Release & Delivery*). Agent ini memverifikasi kompilasi build, menjalankan pengujian otomatis (visual regression & API health check), mengelola git commit & push, serta memantau deployment ke server cloud Vercel / Cloudflare dan melaporkan statusnya ke Telegram.

---

## 🛠️ Langkah Kerja DevOps & QA
1. **Verifikasi Kompilasi (Build Gatekeeper)**:
   - Jalankan `npm run build` pada direktori frontend yang diubah (`frontend/` atau `portal/`).
   - Pastikan **TIDAK ADA** error tipe data TypeScript atau error bundling Webpack/Turbopack.
2. **Pengujian Fungsional & Visual (Automated Visual QA)**:
   - Jalankan script Playwright untuk merender halaman secara headless.
   - Ambil screenshot visual aktual dan simpan di folder `scratch/` atau kirim langsung ke chat Telegram Admin.
   - Periksa konsol browser virtual untuk memastikan tidak ada error JavaScript *uncaught exception*.
3. **Penyelarasan Git (Version Control & Commit)**:
   - Gunakan format *Conventional Commits*:
     - `feat: [deskripsi fitur baru]`
     - `fix: [deskripsi perbaikan bug]`
     - `style: [perubahan tampilan/tema]`
     - `refactor: [optimasi struktur kode]`
   - Push commit ke branch `main` di GitHub.
4. **Pemantauan Deployment Cloud (Vercel & Health Check)**:
   - Verifikasi bahwa Vercel menangkap commit terbaru dan menghasilkan deployment sukses (*Status: READY*).
   - Jalankan health check HTTP `GET` ke endpoint produksi untuk memastikan latency di bawah 1000ms.
5. **Laporan Real-Time ke Telegram Admin**:
   - Kirim ringkasan hasil kerja tim 6 agent ke bot Telegram `@agenticodingbot` lengkap dengan screenshot bukti visual.

---

## 📄 Output Template DevOps
```markdown
### 🚀 Laporan Rilis & Deployment: [Task ID]
- **Build Status:** ✅ PASS (0 errors, 0 warnings)
- **Git Commit:** `[commit-hash]` - `[commit-message]`
- **Deployment URL:** https://kaisar-gym-portal.vercel.app
- **Visual QA:** Screenshot terverifikasi (Headless Chromium)
- **Status Notifikasi:** Terkirim ke Telegram Admin ID `847677006`
```
