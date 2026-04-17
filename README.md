# 🏋️‍♂️ IPB Wellness Hub

Sistem Reservasi dan Monitoring Kuota Gym IPB. 
Proyek ini dikembangkan untuk memenuhi tugas mata kuliah **KOM 1231 Rekayasa Perangkat Lunak**.

## 🛠️ Tech Stack
* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Database & Auth:** Supabase (PostgreSQL)

---

## 🚀 Cara Menjalankan Proyek di Lokal

Bagi anggota tim yang baru melakukan *clone* repositori ini, ikuti langkah-langkah berikut agar aplikasi bisa berjalan di laptop masing-masing:

### 1. Prasyarat
Pastikan kamu sudah menginstal:
* [Node.js](https://nodejs.org/) (versi 18.x atau terbaru)
* Git

### 2. Instalasi Dependensi
Buka terminal di dalam folder proyek, lalu jalankan:
```bash
npm install```

### 3. Setup Variabel Lingkungan (Environment Variables)
⚠️ PERINGATAN: Jangan pernah git add .env.local atau push file ini ke GitHub!
Minta credential (URL dan Anon Key) ke Kemas. Buat file baru bernama .env.local di root folder (sejajar dengan package.json), dan isi dengan format berikut:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[KODE_ANON_KEY_DARI_KEMAS]```
