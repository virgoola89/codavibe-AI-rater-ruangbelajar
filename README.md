# CodaVibe Rater Lab

Ruang belajar AI Rater Indonesia dari CodaVibe Community. Aplikasi memuat 4 modul dan 12 latihan dengan audio sintetis, pilihan ganda, koreksi transkripsi, skor, serta pembahasan. Materi dan media latihan dibuat untuk CodaVibe dari konsep umum anotasi audio.

Frontend menggunakan React dan Vite. Backend menggunakan Node.js, Express, dan SQLite untuk menyimpan pendaftaran. Peserta mengisi nama, email, serta tautan profil LinkedIn. Kata sandi yang disimpan di server membuka dasbor admin dan ekspor CSV.

## Jalankan di komputer

1. Instal Node.js **24**.
2. Ekstrak ZIP dan buka terminal di folder `codavibe-rater-lab-github`.
3. Jalankan perintah berikut.

```bash
npm ci
npm run setup
npm run build
npm start
```

Buka [ruang belajar](http://127.0.0.1:3000). Pilih **Mulai latihan** dan isi formulir. Untuk membuka [dasbor admin](http://127.0.0.1:3000/admin), gunakan nilai `ADMIN_PASSWORD` di file `.env`, lalu pilih **Unduh CSV** saat sudah ada peserta.

`npm run setup` membuat `.env` dengan kata sandi dan kunci sesi acak. Database `data/codavibe.sqlite` dibuat otomatis saat server pertama kali berjalan. Gunakan kembali `.env` dan database yang sama saat menjalankan ulang aplikasi. Jika mengubah frontend, jalankan kembali `npm run build` sebelum memulai server.

Satu email tersimpan sebagai satu pendaftaran. Progres latihan disimpan di browser. Sesi peserta berlaku 30 hari di browser yang sama. Sesi admin berlaku hingga 8 jam. Tombol **Keluar** menghapus sesi admin di browser.

## Unggah ke GitHub

Buat repository kosong di GitHub. Dari folder hasil ekstraksi, jalankan perintah berikut setelah mengganti `USERNAME` dan nama repository sesuai akunmu.

```bash
git init -b main
git add .
git commit -m "Add CodaVibe Rater Lab"
git remote add origin https://github.com/USERNAME/codavibe-rater-lab.git
git push -u origin main
```

GitHub menyimpan source code. Untuk membuka aplikasi secara online, jalankan proyek pada layanan hosting Node.js dengan disk persisten. GitHub Pages hanya dapat menyajikan frontend statis, sehingga backend SQLite dan dasbor admin memerlukan server Node.js.

## Jalankan di hosting Node.js

- Gunakan Node.js **24**. Atur perintah build ke `npm ci && npm run build` dan perintah start ke `npm start`.
- Isi `HOST=0.0.0.0` dan gunakan `PORT` yang ditetapkan penyedia hosting.
- Isi `APP_ORIGIN` dengan alamat HTTPS aplikasi, misalnya `https://lab.contoh.com`, tanpa garis miring di akhir. Origin ini harus sama dengan URL yang dipakai peserta.
- Tetapkan `DATABASE_PATH` ke file dalam disk persisten, misalnya `/data/codavibe.sqlite`. Jalankan satu instans aplikasi yang memiliki akses tulis ke disk itu.
- Tambahkan `ADMIN_PASSWORD` dan `SESSION_SECRET` di pengaturan rahasia hosting. Buat nilai acak yang berbeda untuk keduanya. Kamu bisa menjalankan `npm run setup` di komputer sendiri untuk membuat keduanya. Simpan kata sandi admin untuk membuka `/admin`.
- Biarkan `TRUST_PROXY_HOPS=0` untuk akses langsung. Bila di belakang reverse proxy, masukkan jumlah proxy tepercaya yang memang ada di jalur menuju server dan pastikan akses langsung ke server dibatasi.

Siapa pun yang memperoleh tautan hosting dapat mengisi formulir dan berlatih. Akses daftar peserta dan CSV dibatasi oleh kata sandi admin. File `.env`, database lokal, dan ekspor peserta termasuk dalam pola yang diabaikan Git.

## Menyesuaikan materi dan aplikasi

| File | Isi |
| --- | --- |
| `src/curriculum.ts` | Materi, pertanyaan, kunci jawaban, dan pembahasan |
| `src/lab.tsx` | Ruang belajar, formulir, pemutar audio, dan penilaian |
| `src/admin.tsx`, `src/participants-panel.tsx` | Login admin, daftar peserta, dan tombol unduh |
| `src/globals.css` | Tema visual dan tata letak responsif |
| `public/audio/` | Empat klip audio sintetis |
| `server/index.mjs` | Endpoint pendaftaran, admin, dan ekspor |
| `server/schema.sql`, `server/database.mjs` | Skema SQLite, penyimpanan peserta, dan pembatasan permintaan |
| `server/auth.mjs` | Pemeriksaan kata sandi dan sesi |
