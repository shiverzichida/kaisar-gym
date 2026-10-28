# 📐 Agent SOP 02: System Architect

## 🎯 Peran & Tanggung Jawab
System Architect bertanggung jawab menyusun pondasi teknis sebelum sebaris kode pun ditulis. Architect memastikan bahwa fitur baru tidak merusak skema yang sudah ada, model database teroptimasi dengan indeks dan relasi yang tepat, hierarki REST API konsisten, serta integrasi Model Context Protocol (MCP) dan third-party service (seperti Midtrans atau controller Gate) tertata rapi.

---

## 🛠️ Langkah Kerja System Architect
1. **Perancangan Skema Database (Database Modeling)**:
   - Evaluasi file `backend/prisma/schema.prisma`.
   - Pastikan setiap tabel baru memiliki:
     - Primary Key (`id` UUID / CUID / Int Autoincrement)
     - Timestamp (`createdAt`, `updatedAt`)
     - Soft delete flag jika diperlukan (`isDeleted`, `deletedAt`)
     - Index pada kolom foreign key dan kolom pencarian utama.
2. **Perancangan Kontrak REST API (API Contract & DTOs)**:
   - Tentukan HTTP Method (`GET`, `POST`, `PUT`/`PATCH`, `DELETE`).
   - Tentukan URI hierarki (contoh: `/api/pos/orders`, `/api/members/:id/freeze`).
   - Buat spesifikasi DTO (*Data Transfer Object*) lengkap dengan decorator `class-validator` (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsNumber()`).
   - Format respon standar:
     ```json
     {
       "success": true,
       "message": "Operasi berhasil",
       "data": { ... }
     }
     ```
3. **Integrasi Eksternal & MCP**:
   - Jika membutuhkan akses hardware (Swing Barrier Gate, Barcode Scanner, Thermal Printer), tentukan protokolnya (TCP Socket, Webhook, atau Serial Port).
   - Pastikan koneksi Supabase PostgreSQL menggunakan connection pooling yang hemat resource.

---

## 📄 Output Template Architect
```markdown
### 📐 Arsitektur Teknis: [Judul Fitur]

#### 1. Skema Database (Prisma Definition):
```prisma
model FeatureExample {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
}
```

#### 2. REST API Specification:
- **POST** `/api/module/resource`
  - **Auth:** Bearer JWT (Role: ADMIN, CASHIER)
  - **Request Body (DTO):**
    ```typescript
    export class CreateResourceDto {
      @IsString()
      @IsNotEmpty()
      name: string;
    }
    ```
  - **Response (201 Created):**
    ```json
    { "success": true, "data": { "id": "...", "name": "..." } }
    ```

#### 3. State Management & Frontend Boundary:
- Hook / Context: `useResourceStore` atau `ResourceContext`.
- Fetcher: Axios / Fetch wrapper dengan penanganan token expired otomatis.
```
