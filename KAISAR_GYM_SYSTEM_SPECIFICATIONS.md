# SPESIFIKASI SISTEM MANAJEMEN GYM, POS & PORTAL MEMBER
## BRAND: KAISAR GYM (DURABLE & SCALABLE GYM ECOSYSTEM)
Versi: 1.0 | Tanggal: 17 Oktober 2026

Dokumen ini merupakan panduan arsitektur fungsional, modul POS kasir, backoffice manajemen, portal member, portal trainer, dan sistem kontrol akses yang dirancang untuk **Kaisar Gym**.

---

## DAFTAR ISI
1. [Arsitektur Sistem & Peran Pengguna (User Roles)](#1-arsitektur-sistem--peran-pengguna)
2. [Modul Kasir & Point of Sale (POS)](#2-modul-kasir--point-of-sale-pos)
3. [Modul CRM & Manajemen Member](#3-modul-crm--manajemen-member)
4. [Modul Group & Corporate Membership](#4-modul-group--corporate-membership)
5. [Modul Paket Membership & Inventory Produk](#5-modul-paket-membership--inventory-produk)
6. [Modul Personal Trainer (PT) & Sesi Latihan](#6-modul-personal-trainer-pt--sesi-latihan)
7. [Modul Kelas Studio & Pilates (Group Classes)](#7-modul-kelas-studio--pilates-group-classes)
8. [Modul Kontrol Akses & Absensi (Access Control)](#8-modul-kontrol-akses--absensi-access-control)
9. [Modul Keuangan Operasional & Kasir Shift](#9-modul-keuangan-operasional--kasir-shift)
10. [Modul Laporan & Analitik Bisnis](#10-modul-laporan--analitik-bisnis)
11. [Portal Member (Member Self-Service)](#11-portal-member-member-self-service)
12. [Portal Trainer (PT Self-Service)](#12-portal-trainer-pt-self-service)
13. [Keamanan, Audit Trail & Integrasi API](#13-keamanan-audit-trail--integrasi-api)
14. [Arsitektur Teknologi, Infrastruktur & Analisis Spesifikasi VPS](#14-arsitektur-teknologi-infrastruktur--analisis-spesifikasi-vps)

---

## 1. ARSITEKTUR SISTEM & PERAN PENGGUNA

### 1.1 Peran Pengguna (Role-Based Access Control)
1. **Super Admin / Owner:**
   - Akses penuh ke seluruh konfigurasi cabang, keuangan, audit log, manipulasi master data, laporan omset, dan pengaturan sistem.
2. **Manager Operasional:**
   - Akses manajemen kasir harian, approval cuti, approval penarikan komisi trainer (Salary Request), void transaksi terbatas, pengelolaan trainer & staf.
3. **Manager Studio / Pilates:**
   - Akses khusus pengaturan instruktur, jadwal kelas harian & template berulang, daftar absensi kelas, dan evaluasi kapasitas ruangan.
4. **Kasir (Front Desk / Receptionist):**
   - Penjualan kasir (POS), pendaftaran member baru, scan e-KTP OCR, perpanjangan paket, input pembayaran (cash, EDC, QRIS, split bill), check-in member & tamu.
5. **Marketing / Sales Executive:**
   - Pendaftaran prospek (leads), pembuatan penawaran membership korporat, tracking target penjualan pribadi, dan komisi closing.
6. **Personal Trainer (PT):**
   - Akses ke Portal Trainer: jadwal harian melatih, daftar klien bimbingan, sign-off sesi latihan (potong kuota), workout log, dan riwayat estimasi komisi.
7. **Member / Anggota Gym:**
   - Akses ke Portal Member: QR Code kartu member digital, info sisa hari aktif paket, booking kelas studio, sisa sesi PT, riwayat pembayaran invoice, dan permohonan cuti mandiri.

---

## 2. MODUL KASIR & POINT OF SALE (POS)

### 2.1 Fitur Penjualan Cepat (Fast Checkout POS)
- **Multi-Item Keranjang Belanja:** Kasir dapat menggabungkan transaksi berbagai kategori dalam 1 nota:
  - Paket Membership (Baru / Perpanjangan).
  - Paket Sesi Personal Trainer (4x, 8x, 12x, 24x, dll).
  - Produk Retail (Air mineral, suplemen whey/creatine, merchandise jersey/shaker, makanan sehat).
  - Layanan Tambahan (Biaya registrasi admin, sewa loker bulanan, produk Cuti Unlimited).
- **Pencarian Cepat Member & Produk:** Autocomplete instan berdasarkan Kode Member (KG-YYYY-XXXX), Nama, atau Scan Barcode/RFID.
- **Dukungan Pembeli Tamu (Non-Member / Daily Pass):** Transaksi tiket masuk harian (1 Day Pass / Trial) tanpa wajib registrasi akun lengkap.

### 2.2 Metode Pembayaran Lengkap
- **Tunai (Cash):** Otomatis hitung kembalian dan pembulatan.
- **Non-Tunai (EDC / Transfer Bank):** Pilihan mesin EDC (BCA, Mandiri, BRI, BNI) beserta input nomor referensi/approval code.
- **QRIS Dinamis / Statis:** Tampilan QRIS langsung di layar kasir.
- **Split Payment:** Pembayaran gabungan dalam 1 nota (Contoh: Total Rp 2.000.000 -> Rp 500.000 Cash + Rp 1.500.000 Debit BCA).
- **Piutang / Cicilan (Pending / Partial Payment):** Status transaksi unpaid atau partial dengan batas tempo pelunasan.
- **Online Payment Gateway (Midtrans Webhook):** Notifikasi otomatis lunas jika pembayaran dilakukan online melalui portal/aplikasi.

### 2.3 Diskon, Promo & Sales Person
- **Diskon Fleksibel:** Potongan nominal tetap (Rp) atau persentase (%).
- **Kode Promo / Voucher:** Validasi tanggal berlaku kupon, batas kuota pemakaian, dan minimal belanja.
- **Attribution Sales Person:** Setiap transaksi dapat ditautkan ke staf sales/marketing untuk pembagian komisi closing.

### 2.4 Cetak Struk & Bukti Bayar
- **Thermal Receipt (58mm / 80mm):** Cetak langsung ke printer kasir bluetooth / USB ESC/POS.
- **Digital Invoice PDF:** Cetak format A4/A5 resmi dengan rincian nomor invoice unik (INV-YYYYMMDD-XXXX), status lunas, barcode verifikasi, dan syarat ketentuan gym.
- **Void & Refund:** Pembatalan nota salah input hanya dapat dilakukan oleh role Manager/Admin, dengan sistem pembukuan pembalik otomatis dan pencatatan alasan di audit log.

---

## 3. MODUL CRM & MANAJEMEN MEMBER

### 3.1 Pendaftaran & Identitas Member
- **Auto-Generate Kode Member:** Format unik otomatis Kaisar Gym, contoh: KG-2026-0001.
- **Scan e-KTP OCR Terintegrasi:**
  - Kasir cukup memotret e-KTP member via kamera ponsel atau webcam.
  - Library OCR otomatis membaca dan mengisi kolom: NIK, Nama Lengkap, Alamat, RT/RW, Kecamatan, Tanggal Lahir, dan Jenis Kelamin. Kasir tidak perlu mengetik manual.
- **Live Foto Wajah Member:** Pengambilan foto wajah langsung untuk verifikasi kasir dan integrasi mesin turnstile gerbang.
- **Manajemen STNK & Parkir:**
  - Upload foto STNK member untuk fasilitas bebas parkir gym.
  - Kuota parkir gratis (otomatis aktif jika membership aktif, otomatis dibekukan jika membership habis).

### 3.2 Siklus Hidup Paket (Package Lifecycle Management)
- **Status Member Real-Time:** Active, Inactive, Cuti, Blacklist.
- **Perhitungan Tanggal Paket Cerdas:**
  - Pembelian paket baru sebelum paket lama habis akan otomatis memperpanjang tanggal selesai paket lama (*stacked duration*).
- **Koreksi Tanggal (Edit Tanggal Paket):** Modal khusus bagi admin untuk mengoreksi tanggal mulai/selesai jika terjadi salah input, lengkap dengan catatan riwayat.

### 3.3 Sistem Cuti Member (Leave Management)
1. **Cuti Terjadwal (Scheduled Leave):**
   - Input tanggal mulai cuti dan tanggal selesai cuti.
   - Sistem otomatis menghitung jumlah hari dan memperpanjang masa aktif paket (end_date) sebesar durasi cuti.
   - **Fitur Cuti Susulan (Retroactive Leave):** Jika kasir baru memasukkan cuti setelah tanggal paket sempat lewat (expired), sistem tetap mendeteksi paket yang bersangkutan, menambahkan hari cuti, dan jika tanggal barunya masih berlaku, status member langsung dipulihkan menjadi **Active**.
2. **Cuti Unlimited (Open-Ended / Freeze):**
   - Pembekuan paket tanpa tanggal akhir pasti. Masa aktif berhenti berjalan hingga member datang kembali.
   - Tombol **"Resume Leave"**: Menghitung lama hari beku dan otomatis memundurkan tanggal jatuh tempo paket.
3. **Pembatalan Cuti (Delete Leave):**
   - Jika cuti salah dimasukkan dan dihapus, tanggal paket dikembalikan berkurang sesuai hari cuti yang ditarik kembali.

### 3.4 Auto-Expiry & Integritas Akun
- **Otomatis Nonaktif Saat Paket Habis:** Member yang semua paketnya sudah berakhir dan tidak memiliki sesi PT aktif akan otomatis disinkronkan menjadi status inactive.
- **Perlindungan Anggota Korporat:** Member yang tergabung dalam grup corporate aktif tidak akan salah dinonaktifkan.
- **Sinkronisasi Username & Password:** Username portal default otomatis sama dengan Kode Member, mempermudah login tanpa kartu fisik.

---

## 4. MODUL GROUP & CORPORATE MEMBERSHIP

### 4.1 Jenis Grup Membership
- **Corporate:** B2B kerjasama perusahaan / instansi (Contoh: Paket 10 orang, 15 orang, 20 orang).
- **Community:** Komunitas olahraga / klub lari / instansi kampus.
- **Duo / Family:** Paket berdua atau keluarga dengan potongan tarif bundling.

### 4.2 Struktur Anggota & Slot
- **Kapasitas Slot Maksimum:** Menentukan batas jumlah anggota yang dapat dimasukkan ke dalam grup.
- **Member Utama (Primary / PIC):** Penanggung jawab grup yang tercatat pada invoice pembayaran korporat.
- **Member Anggota (Secondary):** Rekan/karyawan yang mendapatkan hak akses gym atas nama grup tersebut.

### 4.3 Fitur "Aktifkan Sekali Semua" (1-Click Group Activation)
- Pada daftar Group Membership, tersedia tombol cepat aksi **⚡ Aktifkan Group & Semua Anggota**:
  - Sistem mendeteksi paket dan tanggal pembayaran dari member utama.
  - Membuka modal konfirmasi dengan tanggal dan paket yang otomatis terisi.
  - Dalam 1 kali klik:
    1. Status grup berubah menjadi **Aktif**.
    2. Riwayat paket dibuatkan untuk **seluruh anggota grup**.
    3. Status semua anggota langsung berubah menjadi **Aktif**.

---

## 5. MODUL PAKET MEMBERSHIP & INVENTORY PRODUK

### 5.1 Master Paket Membership
- Konfigurasi kategori membership: Reguler Gym, Gym + Studio Kelas, Student/Pelajar, Korporat, VIP All-Access.
- Durasi fleksibel: 1 Hari (Day Pass), 1 Bulan (30 Hari), 3 Bulan (90 Hari), 3+1 Bulan Promo (120 Hari), 6 Bulan, 12 Bulan (365 Hari).
- Tarif harga jual normal vs harga promo.

### 5.2 Master Produk Retail (Inventory)
- Manajemen stok minuman berenergi, suplemen, air mineral, aksesoris gym.
- Data Harga Beli Pokok (HPP) untuk perhitungan laba bersih produk.
- Minimum Stock Alert: Notifikasi otomatis ketika stok produk mendekati batas habis.
- Kartu Stok: Pelacakan otomatis setiap ada penjualan di kasir atau penyesuaian stok manual (Stock Opname).

---

## 6. MODUL PERSONAL TRAINER (PT) & SESI LATIHAN

### 6.1 Manajemen Data Pelatih
- Profil trainer, sertifikasi keahlian, foto, dan kontak.
- Status kerja: *Full-Time Trainer*, *Freelance Trainer*, atau *Special Pilates Instructor*.

### 6.2 Paket Sesi & Penugasan (PT Assignment)
- Pilihan paket sesi: 4x, 8x, 12x, 24x, 36x, hingga 50x sesi.
- Masa berlaku paket sesi (misal 30 hari untuk 8 sesi, 60 hari untuk 16 sesi, 90 hari untuk 24 sesi).
- Penugasan member ke pelatih tertentu (Assignment).

### 6.3 Pelacakan Sesi & Sign-Off Check-In
- **Pencatatan Sesi Selesai (Session Sign-Off):**
  - Dilakukan oleh trainer via Portal Trainer atau oleh kasir.
  - Otomatis mengurangi sisa kuota sesi member (emaining_sessions).
  - Input catatan latihan: otot yang dilatih (*Chest, Back, Legs*), beban angkatan, dan evaluasi fisik member.
- **Verifikasi Kehadiran Sesi:** Mencegah pemotongan sesi ganda pada tanggal dan jam yang sama.

### 6.4 Skema Komisi Pelatih (Commission Engine)
- **Komisi Bertingkat (Graduated Tiering):**
  - Tier 1: 1 - 20 sesi per bulan = Rp X / sesi.
  - Tier 2: 21 - 40 sesi per bulan = Rp Y / sesi.
  - Tier 3: > 40 sesi per bulan = Rp Z / sesi.
- **Komisi Penjualan Paket (Sales Commission):** Persentase reward jika trainer berhasil closing paket PT baru.
- **Modul Pengajuan Gaji / Penarikan Komisi (Salary Request):**
  - Trainer mengajukan permohonan klaim komisi bulanan via portal.
  - Alur approval berjenjang (Disetujui Manager -> Dicairkan Finance/Admin).

---

## 7. MODUL KELAS STUDIO & PILATES (GROUP CLASSES)

### 7.1 Master Kelas Gym
- Tipe kelas: Zumba, Yoga, Aerobic, Body Combat, Pilates Reformer, Spinning / RPM.
- Kapasitas ruangan studio (Max Slot).
- Kriteria akses kelas: Kelas Gratis untuk semua member atau Kelas Berbayar khusus.

### 7.2 Template Jadwal Berulang (Recurring Class Schedule)
- Mengatur pola jadwal mingguan (Contoh: Setiap Senin 18:30 Zumba Studio 1 oleh Instruktur Sarah).
- Fitur auto-generate jadwal harian dari template mingguan tanpa perlu input satu per satu setiap minggu.

### 7.3 Sistem Booking & Absensi Kelas
- Member membooking slot via Portal Member.
- Kuota terisi secara *real-time* (Contoh: Sisa 3 dari 20 slot).
- Sistem batas pembatalan (Cutoff Cancel, misal maksimal 2 jam sebelum kelas dimulai).
- Lembar Absensi Kelas: Instruktur atau kasir mencentang kehadiran member yang sudah booking (*Attended / Absent*).

---

## 8. MODUL KONTROL AKSES & ABSENSI (ACCESS CONTROL)

### 8.1 Absensi Member Masuk Gym
- **Scan Barcode / QR Code:** Member membuka QR Code di ponselnya, discan oleh barcode scanner di meja kasir.
- **Ketik Kode / Cari Nama:** Kasir dapat mencari nama member jika tidak membawa ponsel.
- **Pemeriksaan Hak Akses Otomatis:**
  - Jika paket Aktif &rarr; Layar kasir bunyi beep hijau, foto member muncul di layar.
  - Jika paket Expired / Cuti &rarr; Layar kasir bunyi beep merah peringatan "Paket Telah Habis / Sedang Cuti", kasir langsung menawarkan perpanjangan.

### 8.2 Integrasi Mesin Turnstile Gate (HikCentral / Hikvision / ZKTeco)
- Mesin gerbang putar (Turnstile Gate) terhubung via OpenAPI / TCP-IP:
  - Saat member membayar paket aktif di kasir, wajah/kartu member otomatis didaftarkan ke gate turnstile.
  - Saat paket expired, akses gerbang otomatis dinonaktifkan.

### 8.3 Absensi Staf & Trainer (Selfie + Geolocation Attendance)
- Staf dan Trainer melakukan absensi datang dan pulang dari ponsel masing-masing.
- Wajib foto selfie live (kamera depan).
- Deteksi lokasi GPS dengan radius geofencing (hanya bisa absen jika berada di dalam area gedung Kaisar Gym).
- Deteksi anti-Fake GPS / Mock Location.

---

## 9. MODUL KEUANGAN OPERASIONAL & KASIR SHIFT

### 9.1 Manajemen Pengeluaran Kas (Expenses & Petty Cash)
- Pencatatan biaya operasional harian:
  - Listrik, air, internet.
  - Pembelian galon, perlengkapan kebersihan, detergen laundry handuk.
  - Biaya maintenance alat gym & sparepart treadmill.
- Upload foto kuitansi/struk bukti pengeluaran kas.

### 9.2 Kasir Shift & Closing Kasir Harian
- Modal awal laci kasir (Starting Cash Float).
- Ringkasan otomatis saat serah terima shift:
  - Total Tunai Masuk.
  - Total EDC / Transfer Masuk.
  - Total QRIS Masuk.
  - Total Kas Keluar (Pengeluaran).
  - Saldo Tunai Seharusnya di Laci.
- Fitur cetak laporan ringkasan shift kasir.

---

## 10. MODUL LAPORAN & ANALITIK BISNIS

### 10.1 Laporan Penjualan (Sales & Revenue)
- Laporan Omset Harian, Mingguan, Bulanan, dan Tahunan.
- Pemisahan pendapatan: Omset Membership vs Omset Sesi PT vs Omset Retail/F&B.
- Komposisi metode pembayaran (Berapa persen Cash, EDC BCA, Mandiri, QRIS).

### 10.2 Analisis Retensi & Pertumbuhan Member
- Jumlah member baru bulan ini vs member yang memperpanjang (*renewal*).
- Jumlah member aktif vs member non-aktif vs member cuti.
- Analisis Jam Sibuk Gym (*Peak Hours Heatmap*): Mengetahui jam berapa gym paling ramai untuk efisiensi staf dan instruktur.

### 10.3 Laporan Kinerja Personal Trainer & Sales
- Jumlah sesi yang berhasil diselesaikan masing-masing pelatih.
- Total omset yang dicapai masing-masing staf sales/marketing.
- Ekspor seluruh laporan ke format **Excel (.xlsx)** dan **PDF**.

---

## 11. PORTAL MEMBER (MEMBER SELF-SERVICE)

Akses web responsif dan ramah seluler di mana member dapat login mandiri:
1. **Kartu Member Digital:**
   - Menampilkan Nama Member, Kode Member, Foto Profil, dan Barcode/QR Code dinamis untuk scan check-in di pintu gym.
2. **Dashboard Status Keanggotaan:**
   - Menampilkan paket yang aktif, tanggal mulai, tanggal berakhir, dan countdown hari tersisa.
3. **Jadwal & Booking Kelas Online:**
   - Kalender jadwal kelas studio minggu ini.
   - Tombol **"Book Now"** untuk mengunci slot kelas favorit.
   - Daftar booking saya dan tombol pembatalan sebelum jam kelas dimulai.
4. **Info Sesi Personal Trainer:**
   - Melihat sisa sesi PT yang dimiliki dan nama pelatih pendamping.
   - Log sesi latihan sebelumnya beserta evaluasi dari pelatih.
5. **Riwayat Pembayaran:**
   - Melihat riwayat faktur pembayaran membership dan download invoice digital.
6. **Pengajuan Cuti Online:**
   - Member dapat mengajukan cuti terjadwal langsung dari ponselnya.
7. **Pusat Pengumuman & Promo:**
   - Mengetahui jadwal libur gym, jam operasional hari raya, atau promo perpanjangan terbaru.

---

## 12. PORTAL TRAINER (PT SELF-SERVICE)

Akses khusus bagi Personal Trainer untuk mengelola klien dari smartphone tanpa perlu antri di meja kasir:
1. **Jadwal Mengajar & Melatih Hari Ini:**
   - Daftar nama member yang memiliki janji sesi latihan hari ini.
   - Jadwal kelas studio di mana trainer bertugas sebagai instruktur.
2. **Daftar Klien Aktif:**
   - Melihat seluruh member bimbingannya, sisa kuota sesi member, dan tanggal kadaluarsa sesi.
3. **Sign-Off Sesi Langsung (Check-In Sesi):**
   - Trainer memilih klien yang hadir &rarr; klik **"Selesaikan Sesi"**.
   - Kuota sesi member otomatis terpotong 1 di database secara *real-time*.
   - Trainer dapat menginput catatan beban angkatan & menu latihan.
4. **Monitoring Komisi & Performa Bulanan:**
   - Trainer dapat melihat berapa total sesi yang sudah diselesaikan bulan berjalan dan estimasi komisi yang akan diterima.

---

## 13. KEAMANAN, AUDIT TRAIL & INTEGRASI API

### 13.1 Audit Log Komprehensif
- Setiap aksi penting pada sistem (*Insert, Update, Delete, Void, Ganti Tanggal, Tambah Cuti, Login*) dicatat otomatis di tabel udit_logs:
  - Siapa user yang melakukan (ID, Nama, Role).
  - Waktu persis (Timestamp).
  - IP Address komputer/ponsel kasir.
  - Perbandingan data: Nilai Sebelum (efore_json) vs Nilai Sesudah (fter_json).

### 13.2 Arsitektur RESTful API untuk Mobile App
- API endpoint berbasis JSON dengan autentikasi aman (JWT / Bearer Token):
  - POST /api/auth/login: Login member & trainer.
  - GET /api/member/profile: Profil & status membership.
  - GET /api/classes/schedules: Jadwal kelas live.
  - POST /api/classes/book: Booking slot kelas.
  - GET /api/pt/sessions: Kuota & jadwal latihan.
  - POST /api/attendance/selfie: Absensi staf berbasis foto & koordinat GPS.
  - POST /api/webhooks/midtrans: Konfirmasi pembayaran otomatis dari payment gateway.

---

## 14. ARSITEKTUR TEKNOLOGI, INFRASTRUKTUR & ANALISIS SPESIFIKASI VPS

### 14.1 Stack Teknologi Terpilih
Sistem Kaisar Gym dirancang menggunakan arsitektur full-stack TypeScript modern yang terpisah antara presentation layer, business logic layer, dan persistent data storage:

1. **Frontend (Web Backoffice, POS & Portal Self-Service):**
   - **Framework:** Next.js (React, TypeScript, App Router).
   - **Styling & UI:** Tailwind CSS + shadcn/ui (komponen modern, aksesibel, dan responsif).
   - **State & Data Fetching:** TanStack Query (React Query) + TanStack Table (untuk reporting dan data transaksi POS).
   - **Mobile Experience:** Progressive Web App (PWA) — member dan pelatih dapat memasang portal di homescreen smartphone tanpa unduh dari App Store / Play Store.
   - **Integrasi Hardware Web:**
     - HTML5 MediaDevices API (Webcam PC / Kamera HP) untuk scan e-KTP OCR dan absensi selfie staf.
     - Web Bluetooth / Web USB / ESC-POS printer bridge untuk printer struk thermal kasir (58mm/80mm).
     - Web Geolocation API untuk koordinat GPS absensi staf.

2. **Backend (Enterprise API Service):**
   - **Framework:** NestJS (Node.js LTS, TypeScript).
   - **Arsitektur:** Modular Architecture (`auth`, `members`, `pos`, `trainers`, `classes`, `attendance`, `finance`, `reports`).
   - **Keamanan & RBAC:** NestJS Guards & Decorators untuk penegakan 7 level hak akses pengguna.
   - **Audit Interceptor:** Interceptor bawaan untuk mencatat log otomatis *before_data* vs *after_data*, IP address, dan user ID.
   - **Task Scheduling / Cron:** `@nestjs/schedule` untuk sinkronisasi masa aktif paket (auto-expiry tengah malam) dan auto-generate template jadwal kelas mingguan.
   - **Real-Time Communication:** `@nestjs/websockets` (Socket.io) untuk event check-in gate/kasir secara instan dan live status kehadiran studio.
   - **Pemrosesan Gambar:** Sharp (otomatis kompres foto e-KTP, selfie absensi, dan bukti kuitansi ke format WebP 100-200 KB).

3. **Database & Data Layer:**
   - **Database:** PostgreSQL 16+.
   - **ORM & Data Modeling:** Prisma ORM (Type-safe query builder, migrasi skema deklaratif, dan integritas relasional).
   - **Karakteristik Kunci:**
     - Transaksi ACID kuat untuk split payment kasir, pemotongan kuota sesi PT, dan perhitungan komisi bertingkat.
     - Kolom `JSONB` native untuk audit logs dan parameter promo/diskon fleksibel.
     - Native date/timestamp interval untuk kalkulasi durasi paket bertumpuk (*stacked duration*) dan masa cuti (*leave duration*).

4. **Infrastruktur & Deployment:**
   - **Containerization:** Docker & Docker Compose (isolasi container Next.js, NestJS, PostgreSQL, dan Reverse Proxy).
   - **Web Server / Reverse Proxy:** Nginx atau Caddy dengan sertifikat SSL gratis otomatis (Let's Encrypt).
   - **Alternatif Non-Docker:** Node.js process manager (PM2) + PostgreSQL langsung pada host OS.

---

### 14.2 Analisis Kebutuhan Resource & Spesifikasi VPS

#### A. Estimasi Konsumsi Resource (Kondisi Operasional Aktif)
| Komponen Layanan | Pemakaian RAM Rata-Rata | Pemakaian RAM Peak / Build | Keterangan |
| :--- | :--- | :--- | :--- |
| **Sistem Operasi (Ubuntu 22.04 / 24.04 LTS)** | 250 – 350 MB | ~400 MB | OS Server minimalis |
| **PostgreSQL Database** | 300 – 500 MB | ~800 MB | Query cepat didukung disk NVMe |
| **NestJS Backend API (Node.js)** | 150 – 250 MB | ~350 MB | REST API, Cron, & WebSocket |
| **Next.js Web / POS (Standalone Mode)** | 150 – 300 MB | 1.5 – 2.0 GB *(Hanya saat compile `next build`)* | Mode standalone sangat hemat memori |
| **Nginx Reverse Proxy + SSL** | 30 – 50 MB | ~70 MB | Routing domain & enkripsi HTTPS |
| **Total Runtime Normal** | **~1.0 GB – 1.5 GB** | **~3.0 – 3.5 GB (Saat Deploy/Build)** | **Stabil pada RAM 4 GB** |

---

#### B. Perbandingan Tingkatan Spesifikasi VPS

1. **Spesifikasi Minimal Mutlak (Absolute Minimum VPS):**
   - **CPU:** 1 vCPU
   - **RAM:** 2 GB (Wajib ditambahkan Swap File 2 – 4 GB)
   - **Storage:** 25 – 30 GB SSD
   - **Evaluasi:**
     - *Kelebihan:* Biaya paling ekonomis untuk gym pemula (< 500 member).
     - *Tantangan:* Proses kompilasi Next.js (`npm run build`) di server langsung bisa menyebabkan *high CPU load* dan berisiko OOM jika tidak menggunakan Swap. Sangat disarankan melakukan build di lokal / CI-CD pipeline lalu mengunggah *build artifact* ke VPS.

2. **Spesifikasi Rekomendasi / Ideal (Kondisi VPS Anda Saat Ini - Starter):**
   - **CPU:** 2 vCPU (Intel Xeon / AMD EPYC)
   - **RAM:** 4 GB
   - **Storage:** 50 – 60 GB NVMe
   - **Lokasi:** Jakarta (Latensi lokal super rendah: < 20 ms)
   - **Evaluasi:**
     - **Sangat Optimal & Sempurna:** Mampu menangani 1.000 – 5.000 member aktif dan transaksi harian tanpa lag.
     - Menyisakan ruang RAM bebas (~2.5 GB) yang dapat dialokasikan sebagai *file system buffer* dan *database cache*, sehingga query pencarian member dan POS kasir terasa instan.
     - Proses *build* dan migrasi database dapat dilakukan langsung di dalam server tanpa perlu khawatir OOM.

3. **Spesifikasi Skala Multi-Cabang (Multi-Branch / Enterprise Scale):**
   - **CPU:** 4 vCPU
   - **RAM:** 8 GB
   - **Storage:** 100+ GB NVMe
   - **Evaluasi:** Diperlukan jika Kaisar Gym telah berkembang menjadi jaringan waralaba (franchise) dengan > 5 cabang yang terpusat pada 1 instance server.

---

### 14.3 Rekomendasi Praktik Terbaik Optimasi VPS (4 GB RAM / 60 GB NVMe)

1. **Konfigurasi Swap File 4 GB di NVMe:**
   - Karena media penyimpanan sudah menggunakan NVMe berkecepatan tinggi, alokasikan Swap File sebesar 4 GB pada sistem Ubuntu. Hal ini memberi jaminan keamanan 100% dari kegagalan proses build Next.js.
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Konfigurasi Next.js Standalone Build:**
   - Aktifkan `output: 'standalone'` pada file `next.config.js`. Fitur ini memangkas dependensi node_modules yang tidak terpakai sehingga ukuran image container/memori berkurang hingga 80%.

3. **Kompresi Gambar Otomatis (Sharp):**
   - Setiap foto e-KTP, profil member, atau foto bukti kuitansi kasbon dikompres menjadi resolusi maksimal 1280px WebP (rata-rata 100–150 KB). Dengan kapasitas 60 GB NVMe, server mampu menampung lebih dari **150.000+ foto dokumen** tanpa kehabisan disk.

4. **Tuning Dasar PostgreSQL (Untuk RAM 4 GB):**
   - `shared_buffers = 512MB`
   - `effective_cache_size = 1536MB`
   - `work_mem = 16MB`
   - `maintenance_work_mem = 128MB`

