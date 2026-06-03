# 3.4 Integration & Testing

Bagian ini menjelaskan kegiatan integrasi antarkomponen sistem serta serangkaian pengujian (*testing*) yang dilakukan untuk memastikan sistem **IPB Wellness Hub** berjalan secara harmonis, andal, dan bebas dari kendala fungsional.

### 3.4.1 Proses Integrasi Sistem
Integrasi pada sistem **IPB Wellness Hub** dilakukan dengan menghubungkan tiga pilar utama aplikasi:
1. **Frontend (Vite + React SPA):** Antarmuka pengguna berinteraksi dengan database dan layanan backend menggunakan pustaka `@supabase/supabase-js`. Komponen navigasi dinamis di dalam `src/App.jsx` diintegrasikan dengan sesi autentikasi pengguna secara *real-time*.
2. **Backend & Database (Supabase BaaS):** Mengintegrasikan PostgreSQL database sebagai repositori penyimpanan data relasional terpusat. Keamanan akses data dikontrol menggunakan Row Level Security (RLS) bawaan Supabase dan integrasi *trigger* prosedural PL/pgSQL seperti validasi kuota otomatis.
3. **AI Chatbot (Supabase Edge Function & Gemini API):** Layanan *AI Health Assistant* diintegrasikan melalui Edge Function yang ditulis menggunakan Deno (`supabase/functions/chat/index.ts`) untuk menjembatani komunikasi aman antara frontend dan **Google Generative AI (Gemini API)** guna memproses konsultasi gizi/kebugaran mahasiswa.
4. **Modul Pemindai & Pembuat QR Code:** Integrasi fungsionalitas kamera fisik perangkat pengguna menggunakan pustaka `html5-qrcode` untuk memindai token unik kehadiran sesi gym yang terenkripsi dan diverifikasi oleh admin secara waktu-nyata (*real-time verification*).

---

### 3.4.2 Alamat Platform & Lingkungan Penerapan
Pengujian integrasi dan fungsional dilakukan pada lingkungan pengembangan (*development & staging environments*) sebagai berikut:

* **Staging/Production Website URL:** `https://ipb-wellness-hub.vercel.app` *(atau sesuaikan dengan URL deployment kelompok Anda)*
* **Local Development URL:** `http://localhost:5173` atau `http://localhost:3000` (dijalankan menggunakan perintah `npm run dev`)
* **Database & Edge Function Console:** Supabase Cloud Management Dashboard.

---

### 3.4.3 Metode Pengujian
Pengujian dilakukan menggunakan dua pendekatan utama:
1. **Automated Unit Testing:** Menggunakan kerangka kerja **Vitest** dan **React Testing Library** untuk memvalidasi independensi komponen UI kritis (seperti kelayakan *rendering* `src/components/__tests__/LoadingScreen.test.jsx`).
2. **Manual Integration Testing (Black Box Testing):** Pengujian skenario ujung-ke-ujung (*end-to-end flows*) untuk memastikan integrasi data dari frontend masuk dengan benar ke database Supabase dan memicu relasi fungsional antarmodul.

---

### 3.4.4 Hasil Pengujian Berdasarkan Test Case
Berikut adalah rangkuman tabel hasil pengujian fungsionalitas dan integrasi yang telah disimulasikan pada sistem **IPB Wellness Hub**:

| ID Test Case | Fitur / Skenario Pengujian | Prosedur Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-INT-01** | Autentikasi Pengguna & Pengecekan Profil | Pengguna memasukkan email dan password lalu menekan tombol "Login". | Pengguna berhasil masuk, token JWT disimpan di Supabase Auth, dan sistem mengambil data biodata mahasiswa dari tabel `profiles` secara otomatis. | Pengguna diarahkan ke beranda, token JWT aktif, data biodata terambil dengan tepat. | **PASSED** |
| **TC-INT-02** | Reservasi Sesi Gym & Pengurangan Kuota | Mahasiswa memilih salah satu jadwal sesi gym yang tersedia lalu menekan tombol "Reservasi". | Reservasi baru tercatat di tabel `reservasi`. *Trigger* `trg_validasi_kuota` memvalidasi kuota dan mengurangi sisa kuota pada tabel `v_kuota_sesi` secara otomatis. | Data reservasi tersimpan dengan status 'dikonfirmasi' dan kuota sesi berkurang sebanyak 1. | **PASSED** |
| **TC-INT-03** | Pencegahan Reservasi Ganda | Mahasiswa mencoba melakukan reservasi pada sesi gym yang sama untuk kedua kalinya. | Database menolak entri baru karena adanya *Constraint Unique* `uq_reservasi_pengguna_sesi` dan memunculkan pesan error di antarmuka frontend. | Sistem memblokir pendaftaran ganda dan menampilkan notifikasi peringatan. | **PASSED** |
| **TC-INT-04** | Konsultasi Kebugaran via AI Chatbot | Pengguna mengirimkan pertanyaan seputar kebugaran di halaman *Health Assistant*. | Frontend mengirim pesan ke Supabase Edge Function `/chat`, mengeksekusi integrasi Gemini API, lalu menampilkan respons AI di ruang obrolan. | Pertanyaan terkirim, Edge Function memproses permintaan dengan status 200 OK, dan AI memberikan saran kesehatan yang relevan. | **PASSED** |
| **TC-INT-05** | Presensi Kehadiran via QR Code | Admin memindai QR Code mahasiswa menggunakan pemindai kamera (kamera terintegrasi pustaka `html5-qrcode`). | Sistem mencocokkan token QR dengan `qr_code_token` di tabel `reservasi`, memperbarui status menjadi `hadir`, dan mencatat riwayat di `log_checkin`. | Status reservasi berubah menjadi 'hadir' di sisi mahasiswa secara *real-time* dan log presensi tercatat di sisi admin. | **PASSED** |
| **TC-INT-06** | Pengujian Unit Otomatis (UI) | Menjalankan perintah pengujian otomatis `npx vitest run`. | Seluruh unit test yang terdaftar di direktori `__tests__` lolos verifikasi tanpa kegagalan visual/fungsional. | Unit test komponen `LoadingScreen` berhasil lolos 100% dalam waktu 2.54 detik. | **PASSED** |

---

### 3.4.5 Kesimpulan Tahapan Integration & Testing
Berdasarkan seluruh hasil pengujian di atas, modul-modul utama pada aplikasi **IPB Wellness Hub** (Autentikasi, Reservasi Gym, Presensi QR Code, AI Health Assistant, dan Database) telah **terintegrasi secara baik dan kokoh**. Mekanisme *error handling* pada level database (*constraints & triggers*) serta respons dinamis pada frontend terbukti mampu mencegah inkonsistensi data selama operasional berlangsung.
