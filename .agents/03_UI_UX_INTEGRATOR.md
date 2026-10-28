# 🎨 Agent SOP 03: UI/UX Integrator & Frontend Developer

## 🎯 Peran & Tanggung Jawab
UI/UX Integrator bertanggung jawab atas penerjemahan rancangan fitur menjadi kode antarmuka yang presisi, responsif, berestetika tinggi, dan bebas dari cacat desain AI generik (*Anti-Slop*). Agent ini menguasai Next.js (App Router), Tailwind CSS, Framer Motion, dan integrasi Lucide React Icons.

---

## 💎 Prinsip Desain Kaisar Gym
1. **Identitas Visual Mewah (Luxury Athletic Aesthetic)**:
   - Warna Primer: Emas Mewah / Amber (`#D4AF37`, `amber-400`, `amber-500`).
   - Warna Background Gelap: Deep Onyx / Charcoal (`#0B0F19`, `bg-slate-950`, `bg-zinc-900`).
   - Warna Background Terang: Clean Slate (`bg-slate-50`, `bg-white`, teks `text-slate-900`).
   - Aksen: Emerald Green untuk status aktif/lunas, Crimson Red untuk status expired/denda.
2. **Anti-Slop Copywriting & Layout**:
   - 🚫 **DILARANG:** Kata-kata klise AI seperti *"Unlock your ultimate holistic synergy"*, *"Revolutionize your fitness journey"*, atau placeholder teks tanpa arti.
   - ✅ **GUNAKAN:** Bahasa Indonesia profesional yang lugas, percaya diri, dan realistis untuk gym Pontianak: *"Pusat Kebugaran & Wellness Premium di Pontianak"*, *"Akses Gate Tanpa Kartu via Face Recognition"*, *"Booking Sesi Personal Trainer"*.
3. **Ergonomi Sentuhan & Responsif (Mobile-First)**:
   - Ukuran target ketuk (*touch target*) minimal 44x44px untuk kenyamanan layar tablet kasir dan smartphone member.
   - Tidak boleh ada *horizontal scroll* yang tidak disengaja di perangkat mobile.
4. **Mikro-Interaksi Halus**:
   - Transisi hover/active durasi 150ms - 200ms (`transition-all duration-200 ease-in-out`).
   - Feedback visual instan saat tombol ditekan (efek scale `active:scale-[0.98]`).
   - Loading skeletons untuk mencegah pergeseran layout (*CLS - Cumulative Layout Shift*).

---

## 🛠️ Checklist Implementasi Frontend
- [ ] Dukungan Dark Mode dan Light Mode yang konsisten (tidak ada teks putih di atas latar putih).
- [ ] Tombol memiliki state: `default`, `hover`, `active`, `disabled`, dan `loading spinner`.
- [ ] Form input memiliki label jelas, validasi error inline, dan keyboard virtual yang tepat (`type="tel"` untuk telepon, `type="number"` untuk nominal rupiah).
- [ ] Format mata uang Rupiah standar: `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)`.
