# Guru RJ - Aplikasi Presensi & Administrasi Guru (Mobile-First)

Aplikasi web mobile-first modern untuk manajemen presensi, jadwal mengajar interaktif, dan slip gaji terintegrasi otomatis yang dibangun dengan **React**, **Tailwind CSS**, dan **Firebase Phone Authentication**.

---

## 📱 Fitur Utama & Pembaruan Terkini

### 1. Jadwal Mengajar Interaktif & Integrasi Slip Gaji (Ceklis Mapel)
- **Kartu Mata Pelajaran Interaktif**: Setiap sesi kelas/mapel (contoh: *Kelas 7 B JEPANG*, *Kelas 8 QURDIS*, *Kelas 9 FIQIH*, *Kelas 10 GEO*, *Kelas 11 MTK*) dapat diklik atau dicentang langsung oleh Guru.
- **Klaim Selesai Mengajar**:
  - Saat guru mengklik kartu mata pelajaran, sistem mencatat bahwa guru tersebut telah selesai mengajar sesi tersebut.
  - Data yang tersimpan: **Tanggal**, **Jam Sesi**, **Jenjang & Kelas**, **Mata Pelajaran**, **Nama Guru**, dan **Nomor HP**.
- **Indikator Visual (*Visual Cue*)**:
  - Kartu yang berhasil diklaim guru langsung berubah menjadi **hijau solid (*Emerald Green*)** dengan lencana **`✓ SELESAI (+7.5K)`**, ikon centang (*checkmark*), dan teks *"Klaim Saya"*.
  - Sesi yang sudah diklaim guru lain menampilkan nama pengajar dan berstatus terisi.
  - Efek konfeti perayaan dan notifikasi toast sukses saat sesi berhasil dicentang.
- **Perhitungan Otomatis Slip Gaji (Payroll Formula)**:
  - Rumus: **`Total Sesi Mengajar Terklaim × Rp 7.500 (Tarif per Sesi)`**.
  - Total honor mengajar secara dinamis ditambahkan ke total penghasilan bruto dan *Take Home Pay* (THP) pada Slip Gaji bulan berjalan.
- **Rekapitulasi Rinci di Halaman Slip Gaji**:
  - Menampilkan ringkasan: **`Total Sesi Mengajar Terklaim (X Sesi × Rp 7.500) = Rp ...`**.
  - Rincian daftar setiap sesi yang dicentang: Tanggal, Waktu, Kelas, Mata Pelajaran, dan nominal honor.
  - Tercantum secara rapi pada lembar cetak slip resmi yayasan.

### 2. Jadwal Master Lengkap (MTS & SMAT)
- **MTS (Madrasah Tsanawiyah)**: Kelas 7, Kelas 8, dan Kelas 9 (Senin – Sabtu).
- **SMAT (SMA Terpadu)**: Kelas 10 dan Kelas 11 (Senin – Sabtu).
- Highlight khusus untuk jam **ISTIRAHAT** (`10.35 - 10.50`) dan **Ekstrakurikuler** (*Japanese Club*, *Pramuka*, *Mandarin*).
- Pencarian cepat (*Quick Search*) mata pelajaran (contoh: cari `"MTK"` atau `"B JEPANG"`).

### 3. Autentikasi Nomor HP & Hak Akses Berdasarkan Jabatan
- **Layar Masuk Bersih (Production UI)**: Form input bersih untuk Nomor HP dan Kata Sandi tanpa akun demo.
- **Lupa Kata Sandi (OTP via SMS)**: Reset kata sandi dengan verifikasi kode OTP 6-digit via Firebase Phone Auth (didukung simulator pengujian instan).
- **Routing Berdasarkan Jabatan**:
  - **Admin / Manajemen**: Akun yang memiliki jabatan **"Kepala Sekolah"** (otomatis diarahkan ke Dashboard Manajemen/Admin).
  - **Guru / GTK**: Akun yang tidak memiliki jabatan Kepala Sekolah (otomatis diarahkan ke Dashboard Guru/GTK).

### 4. Fitur Absen Susulan (Backdated Attendance)
- **Evaluasi Presensi Berdasarkan Hari/Tanggal Dipilih**: Saat guru memilih hari yang telah lewat (misal: Senin saat membuka aplikasi di hari Selasa), sistem memeriksa catatan presensi spesifik pada tanggal tersebut.
- **Tombol Cepat "Absen Susulan (Hadir)"**: Guru yang lupa presensi dapat langsung melakukan Absen Susulan dengan satu kali klik dari banner peringatan di modal jadwal atau melalui formulir presensi.
- **Buka Kunci Klaim Sesi & Transport**: Begitu Absen Susulan tersimpan, status presensi hari tersebut menjadi *Hadir*, jadwal sesi mengajar otomatis terbuka untuk diklaim, dan akumulasi uang transport harian (Rp 17.000 / Rp 25.000) langsung terhitung masuk ke slip gaji.

### 5. Fitur Klaim Badal (Guru Pengganti) & Tarif Khusus
- **Tombol Mandiri "Klaim Jam Badal"**: Tersedia langsung di Teacher Dashboard untuk guru yang menggantikan jam mengajar rekan guru lainnya.
- **Formulir Sederhana**: Meminta input Tanggal, Kelas, dan Mata Pelajaran yang digantikan secara mudah dan cepat.
- **Logika & Tarif Khusus**: Sesi mengajar reguler dihitung **Rp 7.500/sesi**, sedangkan sesi **Badal** strictly dihitung **Rp 3.000/sesi**.
- **Kalkulasi & Slip Gaji Transparan**: Di Slip Gaji, honor sesi terpisah secara rinci:
  - `1. Honor Sesi (X Sesi)` — Rp 7.500 × X Sesi
  - `Honor Badal (X Sesi)` — Rp 3.000 × X Sesi
  - `2. Uang Transport (X Hari)`
  - `3. Tunjangan Jabatan`
  - `TOTAL DITERIMA` — Penjumlahan otomatis seluruh komponen pendapatan.

### 6. Fitur Ekspor Rekap Gaji ke Dokumen PDF
- **Tombol "Export Rekap Gaji (PDF)"**: Tersedia di Dashboard Admin (pada bilah navigasi header dan di atas tabel penggajian global).
- **Format Dokumen PDF Rapi & Profesional**: Menggunakan library `jspdf` dan `jspdf-autotable` dalam orientasi *Landscape (A4)*.
- **Kop Dokumen Resmi**: Menampilkan judul *"Rekapitulasi Gaji Guru - MTs Riyadlul Jannah"*, periode bulan aktif, serta tanggal cetak dokumen.
- **Tabel Rekapitulasi Rinci (AutoTable)**:
  1. `No`
  2. `Nama Guru`
  3. `Jabatan`
  4. `Sesi Reguler`
  5. `Sesi Badal`
  6. `Hari Transport`
  7. `Tunjangan Jabatan`
  8. `Total Diterima`
- **Baris Total Keseluruhan**: Menampilkan akumulasi total sesi reguler, sesi badal, total biaya transport, total tunjangan jabatan, dan estimasi grand total anggaran penggajian madrasah.

---

## 🔐 Fitur Login Password & Reset Password Admin (Update #41)
1. **Login Berbasis Password**:
   - Form masuk hanya meminta **Nomor HP** dan **Password** (`type="password"`).
   - Seluruh logika OTP pada login telah dinonaktifkan untuk kenyamanan pengguna.
2. **Default Password Guru**:
   - Seluruh guru secara default memiliki password `"guru123"`.
   - Verifikasi password dilakukan langsung saat login.
3. **Reset Password oleh Admin**:
   - Di Dashboard Admin (baik pada tabel absensi, tabel penggajian, maupun tabel Manajemen Guru di tab "Data & Detail Guru"), terdapat tombol **"Reset Password"** di samping setiap nama guru.
   - Mengklik tombol akan memunculkan **Dialog Konfirmasi**.
   - Jika disetujui, password guru tersebut akan dikembalikan ke `"guru123"` pada global state dan notifikasi sukses akan ditampilkan.

---

## 📱 Desain Responsif Rekap Penggajian Guru Admin (Update #42)
1. **Tata Letak Header Fleksibel**:
   - Area judul, dropdown filter bulan, dan tombol "Export Rekap Gaji (PDF)" otomatis menjadi vertikal stack (`flex-col`) pada layar kecil/HP.
   - Ukuran font disesuaikan (`text-xs sm:text-sm`) dan tombol memenuhi lebar kontainer (`w-full sm:w-auto`) untuk menghindari teks terjepit atau bertumpuk.
2. **Kartu Gaji Guru Mobile (Card Layout)**:
   - Pada layar mobile (`< md`), tampilan tabel horizontal diubah menjadi format **Kartu Per Guru** yang rapi.
   - Setiap kartu memuat informasi guru, tombol Reset Password, breakdown vertikal (Honor Mengajar, Uang Transport, Tunjangan Jabatan), serta Total Diterima dan tombol aksi (Cetak Slip & Detail).
   - Pada layar tablet/desktop (`>= md`), tetap menyajikan tampilan tabel rekapitulasi yang luas.
3. **Tipografi & Spasi Proporsional**:
   - Skala ukuran teks diperhalus (`text-xs`, `text-[10px]`, `text-[9px]`) dengan padding dan gap yang proporsional agar tampilan lega dan nyaman dibaca di smartphone.

---

## ✨ Penyederhanaan Header Rekap Gaji Admin (Update #43)
1. **Penyederhanaan Teks & Tata Letak**:
   - Judul dipersingkat menjadi **"Rekap Gaji"** dan subjudul deskriptif panjang dihapus sepenuhnya.
   - Tombol ekspor dipersingkat menjadi **"Export PDF"**.
2. **Tata Letak Header Mobile**:
   - Judul "Rekap Gaji" berada di baris atas.
   - Dropdown filter bulan dan tombol "Export PDF" tersusun rapi berdampingan dalam satu baris di bawahnya (`flex-row gap-2 w-full`), masing-masing berbagi ruang secara seimbang (`flex-1`) tanpa teks tertekan atau wrap kata per baris.
3. **Kartu Anggaran Hijau**:
   - Label judul pada kartu estimasi disederhanakan menjadi **"Total Gaji Bulan Ini"** yang bersih dan jelas.

---

## ⏰ Pengingat Presensi Harian (Local Notifications - Update #44)
1. **Plugin Terpasang**: `@capacitor/local-notifications` telah diinstal dan diintegrasikan.
2. **Logika Startup (Inisialisasi Otomatis)**:
   - Dijalankan otomatis saat aplikasi dibuka ([App.jsx](file:///c:/Absen-GuruRj/src/App.jsx)) dan pada Dashboard Guru ([TeacherDashboard.jsx](file:///c:/Absen-GuruRj/src/components/TeacherDashboard.jsx)).
   - **Izin Notifikasi**: Meminta izin notifikasi ke pengguna (`checkPermissions` & `requestPermissions`), kompatibel untuk Android 13+ (`POST_NOTIFICATIONS`) dan iOS.
   - **Pencegahan Duplikasi**: Memeriksa dan membatalkan jadwal notifikasi pengingat sebelumnya sebelum membuat jadwal baru.
   - **Jadwal Pengingat Harian**: Mengatur jadwal notifikasi berulang setiap hari tepat pada pukul **09:00 AM (Pagi)** dengan izin bangun saat idle (`allowWhileIdle: true`).
3. **Konten Notifikasi**:
   - **Judul**: `Waktunya Absen! ⏰`
   - **Pesan**: `Jangan lupa isi kehadiran dan cek jadwal mengajar Anda hari ini.`
4. **Tombol Pengingat di Header Guru**:
   - Terdapat ikon lonceng (`Bell`) di header Guru RJ untuk memverifikasi status pengingat dan memicu tes notifikasi langsung ke perangkat.

---

## 📄 Ekspor PDF Kompatibel Android & Lembar Berbagi Native (Update #45)
1. **Plugin Terpasang**: `@capacitor/filesystem` dan `@capacitor/share` telah diintegrasikan.
2. **Generasi Base64**: Mengonversi keluaran `jspdf` menjadi string data Base64 murni tanpa memicu `doc.save()` bawaan browser yang terbatas di lingkungan native WebView.
3. **Penyimpanan Filesystem (`Filesystem.writeFile`)**:
   - Menyimpan string Base64 ke direktori `Directory.Cache` perangkat sebagai file `.pdf` resmi.
4. **Lembar Berbagi Native (`Share.share`)**:
   - Membuka lembar berbagi native Android menggunakan URI file lokal.
   - Admin dapat langsung menyimpan file PDF ke penyimpanan ponsel, membukanya dengan aplikasi PDF viewer, atau mengirimkannya ke WhatsApp, Email, dan Google Drive.
5. **Fallback Browser**: Tetap mempertahankan `doc.save()` otomatis jika aplikasi diakses melalui browser desktop reguler.

---

## 🚀 Akses & Pengujian Aplikasi

Aplikasi aktif dan berjalan di:
```bash
http://localhost:5173/
```





