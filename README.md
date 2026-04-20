<img width="1917" height="1115" alt="image" src="https://github.com/user-attachments/assets/d3a1d5da-5799-4fba-900c-02a82d472f0e" />

# 🏋️‍♂️ IPB Wellness Hub

Sistem Informasi Reservasi dan Monitoring Kuota Gym IPB.  
Proyek Mata Kuliah KOM 1231 Rekayasa Perangkat Lunak (RPL) Semester Genap 2025/2026.

---

## 👥 Kelompok 5

| Nama | Peran |
|------|-------|
| **Kemas Adirangga Nayar** | Database & Backend |
| **Muhammad Wafi Robbani** | Frontend|
| **Prima Jaya Kusuma** | Lead & Backend |

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Backend/Database** | Supabase (PostgreSQL) |
| **Deployment** | --- |

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

Ikuti langkah-langkah berikut untuk mengatur *environment* pengembangan di laptop masing-masing.

### 1. Clone Repositori

Pastikan Git sudah terinstal, lalu jalankan:

```bash
git clone https://github.com/Kemas-Nayar/ipb-wellness-hub.git
cd ipb-wellness-hub
```

### 2. Install Dependencies

Pastikan Node.js sudah terinstal, lalu jalankan:

```bash
npm install
```

### 3. Setup Environment Variables

> ⚠️ **Jangan pernah push kredensial ke GitHub!**

Temukan file konfigurasi di supabase pojok atas tulisan 'Connect' berwarna hijau. Buat file baru bernama `.env.local` di root folder (sejajar dengan `package.json`), lalu isi dengan:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[KODE_ANON_KEY_DARI_SUPABASE]
```

### 4. Setup Database (Supabase)

Skema database sudah dirancang. Untuk melihat atau memperbarui struktur tabel, buka file SQL di:

```
supabase/migrations/20260417_init_schema.sql
```

> **Catatan:** Database utama sudah terhubung ke cloud Supabase. Selama `.env.local` sudah benar, kamu langsung terhubung ke database tanpa setup tambahan.

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Jika berhasil, kamu akan melihat dashboard jadwal gym IPB.

---

## ⚠️ Aturan Kolaborasi Git (Penting!)

Untuk menghindari *merge conflict*, patuhi alur kerja berikut:

**1. Selalu Pull Terbaru**  
Sebelum mulai coding, jalankan:
```bash
git pull origin main
```

**2. Gunakan Branch Baru**  
Jangan langsung coding di `main`. Buat branch fitur sendiri:
```bash
git checkout -b fitur-login-prima
```

**3. Commit dengan Pesan yang Jelas**
```bash
git commit -m "feat: menambah tombol login SSO"
```

**4. Push & Pull Request (PR)**  
Push ke branch kamu, lalu minta *review* dari anggota tim lain di GitHub sebelum di-*merge* ke `main`.

---

Selamat ngoding! 🚀

NOTE: Jika Terjadi Error coba jalankan:
```bash
npm install -D @tailwindcss/postcss
```
