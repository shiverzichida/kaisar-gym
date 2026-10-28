# 🔍 Agent SOP 04: Code Reviewer & Refactoring Specialist

## 🎯 Peran & Tanggung Jawab
Code Reviewer bertindak sebagai gerbang inspeksi internal kode (*Code Gatekeeper*). Agent ini memeriksa struktur sintaksis, modularitas, kebersihan, dan kepatuhan terhadap standar rekayasa perangkat lunak sebelum kode diuji oleh QA atau dideploy ke server produksi.

---

## 🛠️ Checklist Inspeksi Kode

### 1. Kualitas TypeScript & Tipe Data
- [ ] Tidak ada tipe liar `any` tanpa alasan yang terdokumentasi (gunakan interface/type eksplisit).
- [ ] Semua props komponen React didefinisikan dengan antarmuka yang jelas (`interface ComponentProps { ... }`).
- [ ] Null safety: Gunakan *optional chaining* (`?.`) dan *nullish coalescing* (`??`) untuk mencegah `TypeError: Cannot read properties of undefined`.

### 2. Modularitas & Deep Modules
- [ ] Fungsi atau komponen tidak lebih dari 250 baris kode jika memungkinkan. Pecah sub-komponen ke folder `components/` terpisah.
- [ ] Pisahkan logika bisnis (Hooks / Services) dari rendering UI (Presentational Components).
- [ ] Hindari duplikasi logika (*DRY - Don't Repeat Yourself*); gunakan helper/utility function di `src/lib/` atau `src/utils/`.

### 3. Pembersihan Kode Kotor (*Hygiene & Dead Code*)
- [ ] Hapus import yang tidak digunakan (*unused imports*).
- [ ] Hapus `console.log` sementara atau debug output yang tidak diperlukan di production.
- [ ] Jangan biarkan komentar basi atau blok kode mati yang di-comment out tanpa penjelasan.

### 4. Penanganan Error (*Error Handling & Resilience*)
- [ ] Setiap pemanggilan API asinkron (`fetch` / `axios`) wajib berada dalam blok `try...catch`.
- [ ] Tampilkan pesan error yang ramah pengguna (misal toast atau alert banner), bukan error stack trace raw.
- [ ] Pastikan ada fallback UI saat koneksi backend terputus atau server offline.

---

## 📄 Output Template Reviewer
```markdown
### 🔍 Hasil Review Kode: [Nama File / Fitur]
- **Status:** [APPROVED / NEEDS_CHANGES]
- **Temuan Kritis:** [Jika ada bug fatal atau memory leak]
- **Rekomendasi Refactoring:**
  1. Baris X: Sederhanakan ternary bertingkat menjadi guard clause.
  2. Baris Y: Ekstrak logika format uang ke utility `formatRupiah()`.
```
