import Tesseract from 'tesseract.js';

export interface ExtractedKtpData {
  nik: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthPlace: string;
  gender: 'L' | 'P';
  address: string;
  rtRw: string;
  kelDesa: string;
  kecamatan: string;
  rawText: string;
  confidence: number;
}

/**
 * Preprocessing Gambar KTP via HTML5 Canvas (di browser)
 * - Upscaling gambar beresolusi rendah agar stroke huruf teks KTP tebal dan terbaca
 * - Grayscale & Contrast boost untuk meredam watermark garis-garis biru KTP
 */
export async function preprocessKtpCanvas(imageSource: File | Blob | string): Promise<Blob | File | string> {
  // Hanya jalankan jika di browser window
  if (typeof window === 'undefined') return imageSource;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objUrl = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);

      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          // Target minimal lebar 1200px agar tinggi huruf font nama mencapai minimal 25-30px
          let targetWidth = originalWidth;
          let targetHeight = originalHeight;
          if (originalWidth < 1200) {
            const scale = Math.min(3.5, 1200 / originalWidth);
            targetWidth = Math.round(originalWidth * scale);
            targetHeight = Math.round(originalHeight * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            resolve(imageSource);
            return;
          }

          // Render dengan smoothing berkualitas tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Ambil piksel untuk Grayscale + Contrast Enhancement
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const data = imageData.data;

          // Contrast multiplier factor (kontras ditingkatkan 60% agar teks hitam KTP terpisah dari background)
          const contrast = 70;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Teks KTP berwarna gelap/hitam, sedangkan background KTP berwarna biru/cyan terang
            // Beri bobot lebih pada blue channel untuk menekan watermark biru
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const enhanced = factor * (gray - 128) + 128;
            const clamped = Math.max(0, Math.min(255, enhanced));

            data[i] = clamped;
            data[i + 1] = clamped;
            data[i + 2] = clamped;
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(imageSource);
              }
            },
            'image/png',
            1.0
          );
        } catch {
          resolve(imageSource);
        }
      };

      img.onerror = () => resolve(imageSource);
      img.src = objUrl;
    } catch {
      resolve(imageSource);
    }
  });
}

/**
 * Membersihkan string teks KTP dari noise karakter OCR
 */
function cleanKtpValue(val: string): string {
  if (!val) return '';
  return val
    .replace(/^[:;.,\s\-–—_~|]+/g, '') // Hapus pemisah di awal
    .replace(/[:;.,\s\-–—_~|]+$/g, '') // Hapus pemisah di akhir
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Memastikan string layak menjadi Nama (bukan nomor jalan/komplek)
 */
function isValidKtpName(name: string): boolean {
  if (!name || name.length < 3) return false;
  // Nama tidak boleh mengandung digit angka
  if (/\d/.test(name)) return false;
  // Nama tidak boleh berupa kata-kata alamat umum
  const upper = name.toUpperCase();
  if (upper.includes('KOMP') || upper.includes('JALAN') || upper.includes(' JL ') || upper.startsWith('JL') || upper.includes(' NO.') || upper.includes('RT/RW') || upper.includes('KECAMATAN') || upper.includes('GOL.') || upper.includes('DARAH')) {
    return false;
  }
  return true;
}

/**
 * Parsing teks OCR KTP Indonesia dengan toleransi noise e-KTP
 */
export function parseKtpText(text: string, confidence = 85): ExtractedKtpData {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let nik = '';
  let fullName = '';
  let birthPlace = '';
  let birthDate = '';
  let gender: 'L' | 'P' = 'L';
  let address = '';
  let rtRw = '';
  let kelDesa = '';
  let kecamatan = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const upper = rawLine.toUpperCase();

    // 1. Ekstraksi NIK
    if (!nik && (upper.includes('NIK') || /^[0-9DIOBSL]{16}/.test(upper.replace(/\s+/g, '')))) {
      const cleaned = upper
        .replace(/NIK/gi, '')
        .replace(/[:;.,\s\-–—_~=]/g, '')
        .replace(/[D]/g, '0')
        .replace(/[O]/g, '0')
        .replace(/[I]/g, '1')
        .replace(/[L]/g, '1')
        .replace(/[B]/g, '8')
        .replace(/[S]/g, '5');

      const matchDigits = cleaned.match(/\d{16}/);
      if (matchDigits) {
        nik = matchDigits[0];
      } else {
        const anyDigits = cleaned.replace(/\D/g, '');
        if (anyDigits.length >= 14) {
          nik = anyDigits.slice(0, 16);
        }
      }

      // Koreksi khusus e-KTP Kalbar / Pontianak: seringkali '6' terbaca '5' (5171 -> 6171)
      if (nik.startsWith('517101') && (text.includes('KALIMANTAN') || text.includes('PONTIANAK'))) {
        nik = '6' + nik.slice(1);
      }
    }

    // 2. Ekstraksi NAMA LENGKAP
    if (!fullName && (upper.startsWith('NAMA') || upper.includes('NAMA :') || upper.includes('NAMA:') || upper.includes('NAMA -') || upper.includes('NAMA—'))) {
      const parts = rawLine.split(/[:;—\-]/);
      if (parts.length > 1) {
        const candidate = cleanKtpValue(parts.slice(1).join(' ')).toUpperCase();
        // Hapus noise huruf tunggal di akhir misal "NAHEL AL-FATH ICHIDA E" -> "NAHEL AL-FATH ICHIDA"
        const cleanedName = candidate.replace(/\s+[A-Z0-9]$/, '').trim();
        if (isValidKtpName(cleanedName)) {
          fullName = cleanedName;
        }
      }
    }

    // Fallback Nama: baris tepat di bawah NIK jika baris tersebut berupa huruf kapital murni
    if (!fullName && i > 0 && lines[i - 1].toUpperCase().includes('NIK')) {
      const candidate = cleanKtpValue(rawLine).replace(/^NAMA\s*[:;\-]?\s*/i, '').trim();
      if (isValidKtpName(candidate)) {
        fullName = candidate.toUpperCase();
      }
    }

    // 3. Ekstraksi TEMPAT & TANGGAL LAHIR
    if (!birthDate && (upper.includes('TEMPAT') || upper.includes('LAHIR') || upper.includes('TGL') || upper.includes('TGLLAHI') || upper.includes('LAHIC'))) {
      const parts = rawLine.split(/[:;]/);
      const val = parts.length > 1 ? parts.slice(1).join(':') : rawLine;

      // Cari format DD-MM-YYYY atau DD.MM.YYYY
      const dateMatch = val.match(/(\d{1,2})[\s\-\/\.](\d{1,2})[\s\-\/\.](\d{4})/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3];
        birthDate = `${year}-${month}-${day}`;
      }

      // Cari tempat lahir
      const placeMatch = val.split(/[,]/);
      if (placeMatch.length > 0) {
        const placeCand = cleanKtpValue(placeMatch[0].replace(/TEMPAT/gi, '').replace(/TGL/gi, '').replace(/LAHIR/gi, '').replace(/TGLLAHIC/gi, '')).toUpperCase();
        if (placeCand.length >= 3 && !/\d/.test(placeCand)) {
          birthPlace = placeCand;
        }
      }
    }

    // 4. Ekstraksi JENIS KELAMIN
    if (upper.includes('KELAMIN') || upper.includes('LAKI') || upper.includes('PRIA') || upper.includes('PEREMPUAN') || upper.includes('WANITA')) {
      if (upper.includes('PEREMPUAN') || upper.includes('WANITA')) {
        gender = 'P';
      } else if (upper.includes('LAKI') || upper.includes('PRIA')) {
        gender = 'L';
      }
    }

    // 5. Ekstraksi ALAMAT
    if (!address && (upper.startsWith('ALAMAT') || upper.includes('ALAMAT :') || upper.includes('ALAMAT:') || upper.includes('MAMAT') || upper.includes('MAMAK'))) {
      const parts = rawLine.split(/[:;]/);
      let cand = parts.length > 1 ? parts.slice(1).join(':') : rawLine;
      cand = cand.replace(/^MAMAT/i, '').replace(/^MAMAK/i, '').replace(/^ALAMAT/i, '');
      address = cleanKtpValue(cand).toUpperCase();

      // Sambungkan baris berikutnya jika berisi nama komplek atau nomor rumah
      if (lines[i + 1]) {
        const nextUpper = lines[i + 1].toUpperCase();
        if (!nextUpper.includes('RT/RW') && !nextUpper.includes('KEL') && !nextUpper.includes('KECAMATAN') && !nextUpper.includes('AGAMA')) {
          const nextAddr = cleanKtpValue(lines[i + 1]).replace(/^[~_\-]+/, '').trim().toUpperCase();
          if (nextAddr.length > 2) {
            address = `${address} ${nextAddr}`.trim();
          }
        }
      }
    }

    // 6. Ekstraksi RT/RW
    if (!rtRw && (upper.includes('RT/RW') || upper.includes('RTRW') || upper.includes('RT / RW') || upper.includes('RT.RW'))) {
      const parts = rawLine.split(/[:;]/);
      const val = parts.length > 1 ? parts.slice(1).join(':') : rawLine;
      const match = val.match(/(\d{2,3})\s*[\/\\]\s*(\d{2,3})/);
      if (match) {
        rtRw = `${match[1].padStart(3, '0')}/${match[2].padStart(3, '0')}`;
      } else {
        const cleanDigits = val.replace(/\D/g, '');
        if (cleanDigits.length >= 6) {
          rtRw = `${cleanDigits.slice(0, 3)}/${cleanDigits.slice(3, 6)}`;
        }
      }
    }

    // 7. Ekstraksi KELURAHAN / DESA
    if (!kelDesa && (upper.includes('KEL') || upper.includes('DESA') || upper.includes('KEWDESA'))) {
      const parts = rawLine.split(/[:;]/);
      if (parts.length > 1) {
        kelDesa = cleanKtpValue(parts.slice(1).join(':')).replace(/[0-9*~_]+/g, '').trim().toUpperCase();
      }
    }

    // 8. Ekstraksi KECAMATAN
    if (!kecamatan && upper.includes('KECAMATAN')) {
      const parts = rawLine.split(/[:;<\-]/);
      if (parts.length > 1) {
        kecamatan = cleanKtpValue(parts.slice(1).join(' ')).replace(/[0-9*~_=]+/g, '').trim().toUpperCase();
      }
    }
  }

  // Jika Kecamatan belum ditemukan tapi ada teks "PONTIANAK BARAT", set otomatis
  if (!kecamatan && text.toUpperCase().includes('PONTIANAK BARAT')) {
    kecamatan = 'PONTIANAK BARAT';
  }

  // Validasi akhir Nama: JANGAN biarkan nama berisi kata-kata komplek/alamat
  if (!isValidKtpName(fullName)) {
    fullName = '';
  }

  return {
    nik,
    fullName,
    birthDate,
    birthPlace,
    gender,
    address,
    rtRw,
    kelDesa,
    kecamatan,
    rawText: text,
    confidence,
  };
}

/**
 * Jalankan Real OCR dengan Canvas Preprocessing + Tesseract.js
 */
export async function scanKtpWithOcr(
  imageSource: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedKtpData> {
  // 1. Preprocessing gambar via Canvas (Upscaling + Grayscale Contrast Boost)
  let processedSource = imageSource;
  if (typeof window !== 'undefined') {
    if (onProgress) onProgress(15, 'Mengoptimalkan resolusi & kontras KTP');
    processedSource = await preprocessKtpCanvas(imageSource);
  }

  // 2. Jalankan Tesseract OCR Engine
  const result = await Tesseract.recognize(processedSource as any, 'ind+eng', {
    logger: (m) => {
      if (onProgress && m.status) {
        const pct = Math.round(20 + (m.progress || 0) * 80);
        onProgress(pct, m.status);
      }
    },
  });

  const text = result.data.text;
  const conf = Math.round(result.data.confidence || 85);
  return parseKtpText(text, conf);
}
