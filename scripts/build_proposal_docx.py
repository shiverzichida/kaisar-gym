import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def generate_kaisar_gym_proposal(output_path, base_template_path=None):
    # Load base template to preserve original header/footer/styles if available
    if base_template_path and os.path.exists(base_template_path):
        doc = docx.Document(base_template_path)
        # Clear body paragraphs and tables while keeping header, footer and sectPr
        for child in list(doc._body._element):
            if child.tag.endswith('sectPr'):
                continue
            doc._body._element.remove(child)
        print(f"Loaded base template: {base_template_path} (Header & Footer preserved)")
    else:
        doc = docx.Document()
        print("Created new docx document")

    # Page setup - A4 with 0.85-inch margins
    section = doc.sections[0]
    section.page_width = Inches(8.27)   # A4 width
    section.page_height = Inches(11.69) # A4 height
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    # Color Palette
    C_NAVY = RGBColor(10, 17, 40)        # #0A1128 Primary
    C_GOLD = RGBColor(180, 83, 9)        # #B45309 Warm Gold / Amber
    C_BLUE = RGBColor(37, 99, 235)       # #2563EB Brand Blue
    C_GOLD_HEX = "D97706"
    C_NAVY_HEX = "0A1128"
    C_LIGHT_BG_HEX = "F8FAFC"
    C_AMBER_BG_HEX = "FEF3C7"
    C_TEXT = RGBColor(30, 41, 59)        # #1E293B Body text
    C_MUTED = RGBColor(100, 116, 139)    # #64748B Secondary text

    # Set default style font
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Calibri'
    font.size = Pt(10.5)
    font.color.rgb = C_TEXT

    # Helper: Set cell background color
    def set_cell_shading(cell, color_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    # Helper: Set cell padding
    def set_cell_margins(cell, top=120, bottom=120, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    # Helper: Set table borders
    def set_table_borders(table, color="E2E8F0", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    # Helper: Add Styled Heading 1
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.color.rgb = C_NAVY
        return p

    # Helper: Add Styled Heading 2
    def add_h2(text, is_executive=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11)
        if is_executive:
            run.font.color.rgb = RGBColor(180, 83, 9)
        else:
            run.font.color.rgb = C_NAVY
        return p

    # Helper: Add Bullet point
    def add_bullet(level=0, bold_prefix=None, text_after=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
        
        prefix_clean = (bold_prefix or "").strip()
        if prefix_clean and prefix_clean[0].isdigit() and (len(prefix_clean) > 1 and prefix_clean[1] in ('.', ')')):
            bullet_sym = ""
        elif level == 0:
            bullet_sym = "■ "
        elif level == 1:
            bullet_sym = "• "
        else:
            bullet_sym = "– "
            
        if bullet_sym:
            r_bullet = p.add_run(bullet_sym)
            r_bullet.bold = True
            r_bullet.font.size = Pt(10)
            if level == 0:
                r_bullet.font.color.rgb = C_GOLD
            else:
                r_bullet.font.color.rgb = C_NAVY

        if bold_prefix:
            r1 = p.add_run(bold_prefix)
            r1.bold = True
            r1.font.size = Pt(10.5) if level == 0 else Pt(10)
            r1.font.color.rgb = C_NAVY
        if text_after:
            r2 = p.add_run(text_after)
            r2.font.size = Pt(10)
            r2.font.color.rgb = C_TEXT
        return p

    # Helper: Add Callout Box
    def add_callout_box(title, lines, bg_hex=C_LIGHT_BG_HEX, border_hex="D97706"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.57)
        cell = tbl.cell(0, 0)
        set_cell_shading(cell, bg_hex)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)

        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>'
            f'<w:top w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(3)
        rt = cp.add_run(title)
        rt.bold = True
        rt.font.size = Pt(11)
        rt.font.color.rgb = C_NAVY

        for line in lines:
            lp = cell.add_paragraph()
            lp.paragraph_format.space_before = Pt(1)
            lp.paragraph_format.space_after = Pt(2)
            if isinstance(line, tuple):
                r_bold = lp.add_run(line[0])
                r_bold.bold = True
                r_bold.font.size = Pt(9.5)
                r_bold.font.color.rgb = C_NAVY
                r_txt = lp.add_run(line[1])
                r_txt.font.size = Pt(9.5)
                r_txt.font.color.rgb = C_TEXT
            else:
                r = lp.add_run(line)
                r.font.size = Pt(9.5)
                r.font.color.rgb = C_TEXT

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(4)
        p_spacer.paragraph_format.space_after = Pt(0)

    # Assets paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, "frontend", "public", "assets", "img")
    logo_kaisar_path = os.path.join(assets_dir, "kaisar-gym-logo-circle.png")
    prev_overview_path = os.path.join(assets_dir, "preview-dashboard-overview.png")
    prev_pos_path = os.path.join(assets_dir, "preview-pos-cashier.png")
    prev_crm_path = os.path.join(assets_dir, "preview-members-crm.png")

    # ═════════════════════════════════════════════════════════════════════════
    # 1. KOP SURAT / COVER SECTION
    # ═════════════════════════════════════════════════════════════════════════

    # Circular Gold Kaisar Gym Logo
    if os.path.exists(logo_kaisar_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(6)
        p_logo.paragraph_format.space_after = Pt(4)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_kaisar_path, width=Inches(1.25))

    # Main Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("PROPOSAL PENAWARAN SISTEM SMART GYM MANAGEMENT & ACCESS GATE")
    r_title.bold = True
    r_title.font.size = Pt(15.5)
    r_title.font.color.rgb = C_NAVY

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Solusi Terpadu Digitalisasi Operasional, Kontrol Kasir (POS), Manajemen Komisi Trainer, dan Integrasi Pintu Otomatis (Face ID Turnstile Gate)")
    r_sub.italic = True
    r_sub.font.size = Pt(9.5)
    r_sub.font.color.rgb = C_GOLD

    # Document Info Box (Table: Left = Client, Right = Vendor)
    info_table = doc.add_table(rows=1, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_table.autofit = False
    info_table.columns[0].width = Inches(3.25)
    info_table.columns[1].width = Inches(3.32)

    # Left cell - Client
    c_left = info_table.cell(0, 0)
    set_cell_shading(c_left, "F1F5F9")
    set_cell_margins(c_left, top=120, bottom=120, left=150, right=150)
    p1 = c_left.paragraphs[0]
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after = Pt(2)
    r = p1.add_run("DITUJUKAN KEPADA:")
    r.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = C_MUTED

    p2 = c_left.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(0)
    r = p2.add_run("Yth. Manajemen & Pemilik (Owner)\nKAISAR GYM PONTIANAK")
    r.bold = True
    r.font.size = Pt(10.5)
    r.font.color.rgb = C_NAVY

    p2b = c_left.add_paragraph()
    p2b.paragraph_format.space_before = Pt(2)
    p2b.paragraph_format.space_after = Pt(0)
    r = p2b.add_run("Kota Pontianak, Kalimantan Barat")
    r.font.size = Pt(9)
    r.font.color.rgb = C_MUTED

    # Right cell - Vendor
    c_right = info_table.cell(0, 1)
    set_cell_shading(c_right, "F1F5F9")
    set_cell_margins(c_right, top=120, bottom=120, left=150, right=150)
    p3 = c_right.paragraphs[0]
    p3.paragraph_format.space_before = Pt(0)
    p3.paragraph_format.space_after = Pt(2)
    r = p3.add_run("DISUSUN & DIAJUKAN OLEH:")
    r.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = C_MUTED

    p4 = c_right.add_paragraph()
    p4.paragraph_format.space_before = Pt(0)
    p4.paragraph_format.space_after = Pt(0)
    r = p4.add_run("Zag Digital Indonesia\nNahel Al Fath Ichida M.Kom")
    r.bold = True
    r.font.size = Pt(10.5)
    r.font.color.rgb = C_NAVY

    p4b = c_right.add_paragraph()
    p4b.paragraph_format.space_before = Pt(2)
    p4b.paragraph_format.space_after = Pt(0)
    r = p4b.add_run("Konsultan Teknologi & Software House\nPontianak, Kalimantan Barat | Tanggal: 19 Oktober 2026")
    r.font.size = Pt(9)
    r.font.color.rgb = C_MUTED

    set_table_borders(info_table, color="CBD5E1", sz="6")

    # ═════════════════════════════════════════════════════════════════════════
    # 2. BAB 1: PENDAHULUAN & LATAR BELAKANG
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("1. PENDAHULUAN & LATAR BELAKANG")
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Industri kebugaran (fitness center) modern saat ini menuntut efisiensi operasional tinggi, akurasi pelaporan keuangan, "
        "dan transparansi transaksi. Pengelolaan gym konvensional yang mengandalkan pencatatan manual, kartu member fisik non-otomatis, "
        "atau software kasir generik sering kali menimbulkan berbagai kendala kritis yang merugikan pemilik bisnis:"
    )

    add_bullet(0, "1. Kebocoran Akses Masuk (Revenue Leakage): ", 
               "Member yang masa aktifnya telah kadaluarsa (expired) atau pengunjung tanpa tiket masih dapat masuk berlatih karena kelengahan staf atau rasa sungkan, yang menyebabkan kerugian omzet langsung.")
    add_bullet(0, "2. Kerumitan & Selisih Komisi Personal Trainer (PT): ", 
               "Perhitungan kuota sesi latihan murid, bagi hasil komisi trainer tetap vs freelance, dan pembagian insentif bulanan yang rawan salah hitung, memicu perdebatan staf dan membebani manajemen.")
    add_bullet(0, "3. Ketergantungan Kehadiran Owner di Lokasi: ", 
               "Pemilik gym mengalami kesulitan memantau pergerakan omzet harian, stok suplemen kasir, dan tingkat keramaian member secara real-time saat sedang berada di luar kota atau mengelola lini usaha lainnya.")

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Menjawab tantangan tersebut, "
    )
    r_bold = p.add_run("Zag Digital Indonesia")
    r_bold.bold = True
    p.add_run(
        " menghadirkan solusi menyeluruh sistem "
    )
    r_sys = p.add_run("Smart Gym Management & Access Gate")
    r_sys.bold = True
    p.add_run(
        ". Sistem ini menggabungkan aplikasi Kasir POS Gym, Portal Web Resmi kaisargym.com, sistem komisi Personal Trainer transparan, "
        "serta integrasi langsung ke perangkat keras pintu otomatis (Face ID Turnstile Gate 2-Channel) dengan performa andal, cepat, dan anti-kebocoran."
    )

    # ═════════════════════════════════════════════════════════════════════════
    # 3. BAB 2: PILIHAN PAKET INVESTASI SISTEM
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("2. PILIHAN PAKET INVESTASI SISTEM")
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.add_run(
        "Kami menyediakan 3 (tiga) tingkatan paket investasi yang fleksibel dan dapat disesuaikan dengan skala prioritas, "
        "kebutuhan operasional, dan target pertumbuhan Kaisar Gym Pontianak:"
    )

    # Paket Summary Table
    sum_tbl = doc.add_table(rows=4, cols=3)
    sum_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    sum_tbl.autofit = False
    sum_tbl.columns[0].width = Inches(2.25)
    sum_tbl.columns[1].width = Inches(1.5)
    sum_tbl.columns[2].width = Inches(2.82)

    headers = ["PILIHAN PAKET", "NILAI INVESTASI", "FOKUS UTAMA & BENEFIT"]
    for i, h in enumerate(headers):
        cell = sum_tbl.cell(0, i)
        set_cell_shading(cell, C_NAVY_HEX)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    data_summary = [
        ("PAKET 1: BASIC FITUR", "Rp 20.000.000", "Solusi meja kasir, penjualan, dan akses pintu gate otomatis."),
        ("PAKET 2: STANDAR PROFESSIONAL", "Rp 25.000.000", "Sistem operasional lengkap + Portal Web + Manajemen Komisi Trainer."),
        ("PAKET 3: EXECUTIVE SMART GYM\n★ REKOMENDASI TERBAIK", "Rp 30.000.000", "Kendali bisnis di HP Owner, Mobile Live Dashboard & Garansi 4 Bulan.")
    ]

    for row_idx, data in enumerate(data_summary, start=1):
        bg = C_AMBER_BG_HEX if row_idx == 3 else (C_LIGHT_BG_HEX if row_idx % 2 == 1 else "FFFFFF")
        for col_idx, text in enumerate(data):
            cell = sum_tbl.cell(row_idx, col_idx)
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            p = cell.paragraphs[0]
            if col_idx == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            elif col_idx == 0 and row_idx == 3:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text)
            r.font.size = Pt(9.5)
            if row_idx == 3:
                r.bold = True
                if col_idx == 1:
                    r.font.color.rgb = C_GOLD
                else:
                    r.font.color.rgb = C_NAVY
            else:
                if col_idx < 2:
                    r.bold = True

    set_table_borders(sum_tbl, color="CBD5E1", sz="4")

    # A. Rincian Paket 1
    add_h2("A. RINCIAN PAKET 1: BASIC FITUR - Rp 20.000.000")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    r_it = p.add_run("Fokus: Otomasi meja kasir gym dan integrasi pintu masuk otomatis.")
    r_it.italic = True
    r_it.font.color.rgb = C_MUTED

    add_bullet(0, "Sistem POS Kasir Gym Terpadu:")
    add_bullet(1, "Modul Keanggotaan: ", "Pendaftaran member baru lengkap, perpanjangan masa aktif paket, dan penjualan tiket harian (Daily Pass).")
    add_bullet(1, "Penjualan Retail & Inventori Kasir: ", "Pencatatan penjualan suplemen, minuman, merchandise, serta sewa loker dengan pengurang stok otomatis.")
    add_bullet(1, "Cetak Struk Pembayaran: ", "Kompatibel printer thermal kasir (58mm / 80mm) untuk bukti pembayaran member.")
    add_bullet(1, "Laporan Kasir & Tutup Shift: ", "Rekapitulasi total penerimaan kasir harian dan tutup shift langsung dari PC kasir.")

    add_bullet(0, "Integrasi Turnstile Gate Face ID (2 Channel):")
    add_bullet(1, "Validasi Wajah Instan: ", "Sinkronisasi data foto wajah member aktif ke controller mesin Face ID Gate (In & Out).")
    add_bullet(1, "Auto-Block Member Expired: ", "Pintu gate otomatis membuka hanya untuk member aktif; otomatis menolak jika masa aktif habis.")

    add_bullet(0, "Infrastruktur & Layanan Purna Jual:")
    add_bullet(1, "Setup Domain & Cloud Hosting: ", "Termasuk konfigurasi server andal dan domain standar untuk 1 (satu) tahun.")
    add_bullet(1, "Pelatihan Staf On-Site: ", "Pelatihan langsung operasional sistem kasir di lokasi Kaisar Gym Pontianak.")
    add_bullet(1, "Garansi Sistem: ", "Masa garansi perbaikan bug dan pendampingan teknis selama 1 (satu) Bulan.")

    # B. Rincian Paket 2
    add_h2("B. RINCIAN PAKET 2: STANDAR PROFESSIONAL - Rp 25.000.000")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    r_it = p.add_run("Fokus: Manajemen gym menyeluruh, transparansi Personal Trainer, dan Portal Mandiri Member.")
    r_it.italic = True
    r_it.font.color.rgb = C_MUTED

    p_incl = doc.add_paragraph()
    p_incl.paragraph_format.space_after = Pt(4)
    r_b = p_incl.add_run("Mencakup Seluruh Fitur Paket 1 (Basic), Ditambah:")
    r_b.bold = True
    r_b.font.color.rgb = C_GOLD

    add_bullet(0, "Official Web Portal Modern (Domain kaisargym.com):")
    add_bullet(1, "Landing Page Profil Gym: ", "Tampilan website representatif, cepat, dan mobile-responsive yang meningkatkan citra profesional Kaisar Gym.")
    add_bullet(1, "Jadwal Kelas Studio Interaktif: ", "Tampilan jadwal senam, zumba, yoga, dan group class mingguan yang terintegrasi.")

    add_bullet(0, "Portal Khusus Personal Trainer (Akses Smartphone / Tablet):")
    add_bullet(1, "Login Mandiri Trainer: ", "Trainer dapat login mandiri dari smartphone masing-masing untuk mengecek daftar murid.")
    add_bullet(1, "Tracking Sesi Latihan: ", "Pencatatan sesi latihan selesai (sign-off) secara digital dan sisa kuota sesi klien.")
    add_bullet(1, "Form Klaim Komisi Digital: ", "Form pengajuan pencairan komisi sesi yang rapi, akurat, dan transparan.")

    add_bullet(0, "Sistem Perhitungan Komisi Otomatis:")
    add_bullet(1, "Skema Multi-Trainer: ", "Perhitungan komisi otomatis sesuai skema gym (Trainer Tetap vs Freelance) guna mengeliminasi perselisihan hitungan di akhir bulan.")

    add_bullet(0, "Portal Mandiri Member (Self-Service Member Portal):")
    add_bullet(1, "Cek Status dari HP: ", "Member dapat login mandiri untuk mengecek masa aktif paket, kuota sesi PT, dan riwayat transaksi.")

    add_bullet(0, "Audit Log Kehadiran Gate Real-Time:")
    add_bullet(1, "Histori Kunjungan: ", "Pencatatan jam kedatangan dan kepulangan member tersimpan rapi dan dapat diaudit sewaktu-waktu.")

    add_bullet(0, "Fitur Monitoring Owner (Level Basic):")
    add_bullet(1, "Akses Laporan Web Browser: ", "Owner dapat melihat ringkasan omzet dan data member melalui browser laptop/PC.")

    add_bullet(0, "Infrastruktur & Layanan Purna Jual:")
    add_bullet(1, "Server Cloud VPS Berkecepatan Tinggi: ", "Free Domain .com + Cloud VPS Server berkecepatan tinggi (1 tahun).")
    add_bullet(1, "Pelatihan Lengkap: ", "Pelatihan staf kasir dan seluruh personal trainer di lokasi Kaisar Gym.")
    add_bullet(1, "Garansi Sistem: ", "Masa garansi dan pendampingan teknis selama 3 (tiga) Bulan.")

    # C. Rincian Paket 3
    add_h2("C. RINCIAN PAKET 3: EXECUTIVE SMART GYM - Rp 30.000.000 ★", is_executive=True)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    r_it = p.add_run("Rekomendasi Utama: Memberikan kendali penuh dan kenyamanan bagi Owner untuk memantau operasional gym secara real-time dari mana saja melalui smartphone tanpa harus selalu berada di lokasi.")
    r_it.italic = True
    r_it.font.color.rgb = C_GOLD

    p_incl = doc.add_paragraph()
    p_incl.paragraph_format.space_after = Pt(4)
    r_b = p_incl.add_run("Mencakup Seluruh Fitur Paket Standar, Ditambah Fitur Eksklusif Owner:")
    r_b.bold = True
    r_b.font.color.rgb = C_GOLD

    add_bullet(0, "📱 Mobile Executive Live Dashboard (Khusus Layar HP Owner):")
    add_bullet(1, "Live Revenue Tracker: ", "Pantau pergerakan omzet kasir hari ini, minggu ini, dan bulan ini secara live detik demi detik langsung dari HP (Android & iOS).")
    add_bullet(1, "Real-Time Live Headcount: ", "Ketahui secara akurat berapa jumlah member yang sedang berada di dalam area gym detik ini (terhitung otomatis dari sensor Turnstile Gate).")
    add_bullet(1, "Shift & Cash Drawer Monitor: ", "Pantau saldo uang fisik di laci kasir saat kasir bertugas untuk mencegah selisih uang setoran.")

    add_bullet(0, "📊 Trainer & Sales Leaderboard:")
    add_bullet(1, "Peringkat Coach & Retensi: ", "Statistik otomatis performa pelatih terlaris (Top Performance Coach), produktivitas sales, serta persentase retensi member aktif.")

    add_bullet(0, "👑 Layanan Prioritas & Pendampingan:")
    add_bullet(1, "Garansi 4 Bulan Penuh: ", "Free maintenance, pendampingan teknis, dan penyesuaian minor selama 4 (empat) Bulan.")
    add_bullet(1, "Jalur Respon Prioritas (Fast-Track Support): ", "Dukungan teknis prioritas langsung dari tim senior developer Zag Digital Indonesia.")

    # ═════════════════════════════════════════════════════════════════════════
    # 4. BAB 3: PREVIEW DESAIN ANTARMUKA & DASHBOARD SISTEM
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("3. PREVIEW DESAIN ANTARMUKA & DASHBOARD SISTEM")
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.add_run(
        "Berikut adalah cuplikan antarmuka (UI/UX) sistem Kaisar Gym Pontianak yang dirancang khusus dengan tema modern luxury "
        "(Deep Navy & Gold Accent), intuitif, dan responsif:"
    )

    # Helper: Add Image with Caption
    def add_preview_image(img_path, title, caption, width_in=5.8):
        if os.path.exists(img_path):
            p_img_title = doc.add_paragraph()
            p_img_title.paragraph_format.space_before = Pt(10)
            p_img_title.paragraph_format.space_after = Pt(3)
            p_img_title.paragraph_format.keep_with_next = True
            r_t = p_img_title.add_run(title)
            r_t.bold = True
            r_t.font.size = Pt(10.5)
            r_t.font.color.rgb = C_NAVY

            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(2)
            p_img.paragraph_format.space_after = Pt(3)
            p_img.paragraph_format.keep_with_next = True
            r = p_img.add_run()
            r.add_picture(img_path, width=Inches(width_in))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(1)
            p_cap.paragraph_format.space_after = Pt(8)
            r_c = p_cap.add_run(caption)
            r_c.italic = True
            r_c.font.size = Pt(8.5)
            r_c.font.color.rgb = C_MUTED

    # 1. Dashboard Overview
    add_preview_image(
        prev_overview_path,
        "Gambar 1: Tampilan Executive Live Dashboard & KPI Overview",
        "Gambar 1. Antarmuka Dashboard Overview: Pantauan omzet live, jumlah kunjungan aktif di gym, performa kasir, dan ringkasan keuangan harian.",
        width_in=5.8
    )

    # 2. POS Cashier
    add_preview_image(
        prev_pos_path,
        "Gambar 2: Modul Meja Kasir Point of Sale (POS) & Billing Transaksi",
        "Gambar 2. Antarmuka Kasir POS: Katalog paket membership, tiket harian daily pass, produk retail, diskon voucher promo, dan cetak struk thermal kasir.",
        width_in=5.6
    )

    # 3. CRM Member & Gate
    add_preview_image(
        prev_crm_path,
        "Gambar 3: Modul Master Member CRM & Integrasi Face Recognition Gate",
        "Gambar 3. Antarmuka Master Member: Pengelolaan database member lengkap, scan e-KTP OCR otomatis, foto selfie face recognition, dan kontrol akses palang pintu.",
        width_in=5.6
    )

    # ═════════════════════════════════════════════════════════════════════════
    # 5. BAB 4: TABEL PERBANDINGAN FITUR LENGKAP
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("4. TABEL PERBANDINGAN FITUR LENGKAP")
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.add_run(
        "Tabel berikut merangkum matriks perbandingan fitur antara ketiga paket investasi sistem:"
    )

    feature_table = doc.add_table(rows=11, cols=4)
    feature_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    feature_table.autofit = False
    feature_table.columns[0].width = Inches(2.65)
    feature_table.columns[1].width = Inches(1.25)
    feature_table.columns[2].width = Inches(1.25)
    feature_table.columns[3].width = Inches(1.42)

    col_headers = ["FITUR & MODUL SISTEM", "PAKET BASIC\n(Rp 20 Jt)", "PAKET STANDAR\n(Rp 25 Jt)", "PAKET EXECUTIVE\n(Rp 30 Jt) ★"]
    for i, h in enumerate(col_headers):
        cell = feature_table.cell(0, i)
        set_cell_shading(cell, C_NAVY_HEX)
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        if i == 3:
            r.font.color.rgb = RGBColor(255, 192, 103)
        else:
            r.font.color.rgb = RGBColor(255, 255, 255)

    table_data = [
        ("Sistem Kasir POS & Cetak Struk Thermal", "Tersedia", "Tersedia", "Tersedia"),
        ("Integrasi 2-Channel Face ID Turnstile Gate", "Tersedia", "Tersedia", "Tersedia"),
        ("Auto-Block Member Expired di Pintu Masuk", "Tersedia", "Tersedia", "Tersedia"),
        ("Official Web Portal (kaisargym.com)", "Sederhana", "Lengkap", "Lengkap"),
        ("Portal Personal Trainer (Cek Sesi di HP/Tablet)", "Tidak Ada", "Tersedia", "Tersedia"),
        ("Kalkulasi Komisi PT Otomatis (Tetap vs Freelance)", "Tidak Ada", "Tersedia", "Tersedia"),
        ("Portal Mandiri Member (Cek Masa Aktif dari HP)", "Tidak Ada", "Tersedia", "Tersedia"),
        ("Mobile Executive Dashboard di Layar HP Owner", "Tidak Ada", "Basic (Web)", "Executive Pro (Live App)"),
        ("Trainer & Sales Leaderboard Performance", "Tidak Ada", "Tabel Biasa", "Leaderboard Otomatis"),
        ("Masa Garansi & Pendampingan Sistem", "1 Bulan", "3 Bulan", "4 Bulan (Exclusive)")
    ]

    for row_idx, row in enumerate(table_data, start=1):
        bg = C_LIGHT_BG_HEX if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row):
            cell = feature_table.cell(row_idx, col_idx)
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
            p = cell.paragraphs[0]
            if col_idx > 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.bold = True
                r.font.color.rgb = C_NAVY
            elif col_idx == 3:
                r.bold = True
                r.font.color.rgb = C_GOLD
            else:
                if text == "Tersedia":
                    r.font.color.rgb = RGBColor(22, 101, 52)
                elif text == "Tidak Ada":
                    r.font.color.rgb = RGBColor(148, 163, 184)

    set_table_borders(feature_table, color="CBD5E1", sz="4")

    # ═════════════════════════════════════════════════════════════════════════
    # 6. BAB 5: TAHAPAN PENGERJAAN & TERMIN PEMBAYARAN
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("5. TAHAPAN PENGERJAAN & TERMIN PEMBAYARAN")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.add_run(
        "Untuk menjamin kepastian jadwal implementasi dan kenyamanan bersama, pengerjaan proyek dibagi ke dalam 3 (tiga) tahapan terukur:"
    )

    tahapan_info = [
        ("Tahap 1 - Setup Database, Server & Web Portal (Hari 1 - 7):", [
            ("Termin 1 (Uang Muka / DP 40%): ", "Dibayarkan saat penandatanganan lembar persetujuan proyek."),
            ("Pekerjaan: ", "Penyediaan cloud server, registrasi domain kaisargym.com, setup struktur database PostgreSQL, konfigurasi modul POS kasir, dan penyesuaian paket harga membership.")
        ]),
        ("Tahap 2 - Integrasi Hardware Gate & Uji Coba Lapangan (Hari 8 - 14):", [
            ("Termin 2 (Progress 30%): ", "Dibayarkan setelah modul software siap terintegrasi ke gate."),
            ("Pekerjaan: ", "Pemasangan jalur komunikasi data jaringan ke mesin Turnstile Face ID 2 Channel di lokasi Kaisar Gym, sinkronisasi template wajah, dan pengujian keakuratan buka-tutup palang otomatis.")
        ]),
        ("Tahap 3 - Pelatihan Staf/Trainer, Go-Live & Serah Terima (Hari 15 - 20):", [
            ("Termin 3 (Pelunasan 30%): ", "Dibayarkan saat serah terima sistem operasional penuh."),
            ("Pekerjaan: ", "Pelatihan menyeluruh staf kasir dan personal trainer, input migrasi data member awal, dan peresmian sistem beroperasi penuh (Go-Live).")
        ])
    ]

    for title, lines in tahapan_info:
        add_callout_box(title, lines, bg_hex=C_LIGHT_BG_HEX, border_hex=C_GOLD_HEX)

    p_durasi = doc.add_paragraph()
    p_durasi.paragraph_format.space_before = Pt(2)
    p_durasi.paragraph_format.space_after = Pt(6)
    r_est = p_durasi.add_run("Estimasi Total Durasi Implementasi: ")
    r_est.bold = True
    p_durasi.add_run("15 - 20 Hari Kerja (Siap operasional penuh mendampingi pembukaan / operasional Kaisar Gym).")

    # ═════════════════════════════════════════════════════════════════════════
    # 7. BAB 6: PROFIL PENGEMBANG (ZAG DIGITAL INDONESIA)
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("6. TENTANG PENGEMBANG (ZAG DIGITAL INDONESIA)")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Zag Digital Indonesia adalah penyedia solusi teknologi informasi, pengembangan perangkat lunak terintegrasi, "
        "dan otomasi sistem hardware di Pontianak, Kalimantan Barat. Dipimpin oleh "
    )
    r_lead = p.add_run("Nahel Al Fath Ichida M.Kom")
    r_lead.bold = True
    p.add_run(
        ", kami memiliki rekam jejak dalam merancang ekosistem aplikasi performa tinggi untuk Point of Sale (POS), sistem manajemen membership, "
        "serta integrasi perangkat IoT & Access Gate. Komitmen kami adalah menghadirkan sistem yang tahan uji (durable), mudah dioperasikan staf, "
        "serta memberikan ketenangan pikiran dan kontrol penuh bagi pemilik bisnis (Owner)."
    )

    # ═════════════════════════════════════════════════════════════════════════
    # 8. BAB 7: LEMBAR PERSETUJUAN & TANDA TANGAN KERJASAMA
    # ═════════════════════════════════════════════════════════════════════════
    add_h1("7. LEMBAR PERSETUJUAN KERJASAMA")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.add_run(
        "Dengan menandatangani dokumen ini, pihak Manajemen / Owner Kaisar Gym Pontianak menyatakan menyetujui penawaran implementasi sistem "
        "Smart Gym Management & Access Gate dengan pilihan paket investasi sebagai berikut:"
    )

    # Checklist Options
    p_opt = doc.add_paragraph()
    p_opt.paragraph_format.space_before = Pt(4)
    p_opt.paragraph_format.space_after = Pt(12)
    p_opt.paragraph_format.left_indent = Inches(0.2)
    p_opt.add_run("[   ]  PAKET 1: BASIC FITUR (Rp 20.000.000,-)\n").bold = True
    p_opt.add_run("[   ]  PAKET 2: STANDAR PROFESSIONAL (Rp 25.000.000,-)\n").bold = True
    r_opt3 = p_opt.add_run("[   ]  PAKET 3: EXECUTIVE SMART GYM (Rp 30.000.000,-) ★ Rekomendasi Utama")
    r_opt3.bold = True
    r_opt3.font.color.rgb = C_GOLD

    p_date = doc.add_paragraph()
    p_date.paragraph_format.space_after = Pt(12)
    p_date.add_run("Pontianak, ________________________ 2026")

    # Signature Table (2 Columns)
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = False
    sig_table.columns[0].width = Inches(3.25)
    sig_table.columns[1].width = Inches(3.32)

    # Pihak Pertama (Vendor)
    c_sig1 = sig_table.cell(0, 0)
    set_cell_margins(c_sig1, top=100, bottom=100, left=100, right=100)
    p = c_sig1.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("PIHAK PERTAMA (Penyedia Sistem)\n")
    r.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = C_MUTED
    r2 = p.add_run("Zag Digital Indonesia")
    r2.bold = True
    r2.font.size = Pt(11)
    r2.font.color.rgb = C_NAVY

    p_space1 = c_sig1.add_paragraph()
    p_space1.paragraph_format.space_before = Pt(40)
    p_space1.paragraph_format.space_after = Pt(0)
    r_line1 = p_space1.add_run("_____________________________________\n")
    r_line1.bold = True
    r_name1 = p_space1.add_run("Nahel Al Fath Ichida M.Kom\n")
    r_name1.bold = True
    r_name1.font.size = Pt(10.5)
    r_name1.font.color.rgb = C_NAVY
    r_role1 = p_space1.add_run("Lead IT Consultant & Founder")
    r_role1.font.size = Pt(9)
    r_role1.font.color.rgb = C_MUTED

    # Pihak Kedua (Client)
    c_sig2 = sig_table.cell(0, 1)
    set_cell_margins(c_sig2, top=100, bottom=100, left=100, right=100)
    p = c_sig2.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("PIHAK KEDUA (Manajemen / Owner)\n")
    r.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = C_MUTED
    r2 = p.add_run("KAISAR GYM PONTIANAK")
    r2.bold = True
    r2.font.size = Pt(11)
    r2.font.color.rgb = C_NAVY

    p_space2 = c_sig2.add_paragraph()
    p_space2.paragraph_format.space_before = Pt(40)
    p_space2.paragraph_format.space_after = Pt(0)
    r_line2 = p_space2.add_run("_____________________________________\n")
    r_line2.bold = True
    r_name2 = p_space2.add_run("Owner / Manajemen Kaisar Gym\n")
    r_name2.bold = True
    r_name2.font.size = Pt(10.5)
    r_name2.font.color.rgb = C_NAVY
    r_role2 = p_space2.add_run("Pemilik Bisnis / Otoritas Keputusan")
    r_role2.font.size = Pt(9)
    r_role2.font.color.rgb = C_MUTED

    # Robust multi-target save loop
    all_targets = [
        output_path,
        r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP (REVISI).docx",
        r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP (KAISAR GYM).docx",
        r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP (ZAG DIGITAL INDONESIA).docx",
        r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP.docx",
        r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL_PENGEMBANGAN_APLIKASI_FITNESS_MEMBERSHIP_KAISAR_GYM.docx"
    ]

    saved_list = []
    seen = set()
    for tgt in all_targets:
        norm = os.path.normpath(tgt)
        if norm in seen:
            continue
        seen.add(norm)
        try:
            doc.save(tgt)
            saved_list.append(tgt)
            print(f"[OK] Saved proposal to: {os.path.basename(tgt)}")
        except Exception as e:
            print(f"[LOCKED] Could not write to {os.path.basename(tgt)} (File open in Word)")

    return saved_list

if __name__ == "__main__":
    base_tpl = r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP_ORIGINAL_BACKUP.docx"
    target = r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP (REVISI).docx"
    generate_kaisar_gym_proposal(target, base_template_path=base_tpl)

