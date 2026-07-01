# PRD - Live CCTV Web Portal Sekolah

## 1. Ringkasan Produk

Live CCTV Web Portal Sekolah adalah aplikasi web untuk menampilkan akses CCTV sekolah secara aman berdasarkan peran pengguna. Sistem menggunakan arsitektur hybrid:

- Streaming video berjalan di perangkat lokal sekolah menggunakan Linux PC dan go2rtc.
- Portal web, autentikasi, database, dan kontrol akses berjalan di cloud menggunakan Next.js, Supabase, dan Netlify.
- Akses video dari luar jaringan sekolah dibuka melalui Cloudflare Tunnel.

Tujuan utama aplikasi adalah menyediakan akses CCTV yang aman, terkontrol, hemat bandwidth, dan mudah dikelola oleh admin sekolah.

## 2. Tujuan Produk

1. Menyediakan portal CCTV berbasis web untuk admin, kepala sekolah, dan orang tua.
2. Membatasi akses kamera berdasarkan role dan kelas anak.
3. Mengurangi beban bandwidth pada mode monitoring admin menggunakan snapshot JPEG, bukan live stream penuh.
4. Mencatat aktivitas penting seperti login dan akses kamera.
5. Memudahkan admin mengelola user, kelas, kamera, dan mapping akses.

## 3. Pengguna dan Role

### 3.1 Admin

Admin adalah pengguna IT atau sistem sekolah yang memiliki akses penuh.

Fitur utama:

- Melihat dashboard admin.
- Melihat log aktivitas pengguna.
- Menambah, mengubah, menghapus, dan mengimpor user.
- Menentukan role user.
- Membuat dan mengelola kelas.
- Menghubungkan orang tua ke kelas.
- Menghubungkan kamera ke kelas.
- Mengelola metadata kamera.
- Melihat semua kamera dalam mode snapshot non-live.

### 3.2 Kepala Sekolah

Kepala Sekolah adalah pengguna manajemen sekolah yang dapat melihat semua kelas dan kamera terkait.

Fitur utama:

- Melihat dashboard ringkasan.
- Melihat daftar semua kelas.
- Membuka live CCTV berdasarkan kelas.
- Melihat semua kamera yang terhubung ke kelas tertentu.

### 3.3 Orang Tua

Orang Tua adalah pengguna terbatas yang hanya dapat melihat kamera pada kelas anaknya.

Fitur utama:

- Melihat dashboard welcome.
- Melihat daftar kamera yang diizinkan.
- Membuka live stream kamera kelas anak.
- Tidak dapat melihat kelas atau kamera di luar hak aksesnya.

## 4. Lingkup Produk

### 4.1 In Scope

- Aplikasi web Next.js App Router.
- Autentikasi menggunakan Supabase Auth.
- Database PostgreSQL Supabase.
- Middleware role-based access control.
- Row Level Security Supabase.
- CRUD user profile, kelas, kamera, dan relasi.
- Live player WebRTC/HLS dari go2rtc melalui Cloudflare Tunnel.
- Admin snapshot monitoring menggunakan endpoint frame JPEG go2rtc.
- Logging aktivitas pengguna.
- Deployment ke Netlify.

### 4.2 Out of Scope untuk fase ini

- Rekaman video CCTV.
- Motion detection.
- Push notification.
- Mobile app native.
- AI object/person detection.
- Multi-school tenancy.
- Payment atau subscription.

## 5. Kebutuhan Fungsional

### 5.1 Autentikasi

- User login menggunakan email dan password Supabase Auth.
- Setelah login, user diarahkan berdasarkan role:
  - Admin ke `/admin`
  - Kepala Sekolah ke `/principal`
  - Orang Tua ke `/parent`
- User yang belum login diarahkan ke `/login`.
- User yang mengakses halaman tanpa izin diarahkan ke halaman unauthorized.

### 5.2 Manajemen User

Admin dapat:

- Membuat user baru.
- Mengatur nama user.
- Mengatur role user.
- Menghubungkan user role Orang Tua ke satu atau beberapa kelas.
- Melihat daftar user.
- Mengubah data profil user.
- Menonaktifkan atau menghapus akses user bila dibutuhkan.

Catatan:

- Pembuatan user Auth dapat dilakukan melalui Supabase Admin API di server route yang aman.
- Service role key tidak boleh digunakan di sisi client.

### 5.3 Manajemen Kelas

Admin dapat:

- Membuat kelas.
- Mengubah nama kelas.
- Menghapus kelas.
- Melihat kamera yang terhubung ke kelas.
- Mengatur parent yang terhubung ke kelas.

### 5.4 Manajemen Kamera

Admin dapat:

- Menambah metadata kamera.
- Mengubah nama kamera.
- Mengubah tunnel URL.
- Mengisi deskripsi kamera.
- Menghapus metadata kamera.
- Menghubungkan kamera ke satu atau banyak kelas.

Data kamera minimal:

- Nama kamera.
- Slug atau source id go2rtc.
- Tunnel URL live stream.
- Snapshot URL atau konfigurasi endpoint frame.
- Deskripsi.
- Status aktif.

### 5.5 Live View Kamera

Kepala Sekolah:

- Bisa membuka daftar kelas.
- Bisa melihat kamera live yang terhubung ke kelas yang dipilih.

Orang Tua:

- Hanya bisa melihat kamera live yang terhubung ke kelasnya.
- Tidak bisa mengakses kamera lain walaupun mengetahui URL route aplikasi.

### 5.6 Monitoring Admin Snapshot

Admin dapat melihat semua kamera secara bersamaan menggunakan snapshot JPEG.

Aturan:

- Tidak menggunakan stream WebRTC penuh untuk grid semua kamera.
- Setiap kamera mengambil gambar dari endpoint go2rtc:

```text
https://tunnel-domain.example.com/api/frame.jpeg?src=nama_camera
```

- Snapshot diperbarui otomatis, misalnya setiap 5 sampai 15 detik.
- Interval refresh harus bisa dikonfigurasi.

### 5.7 Activity Logs

Sistem mencatat aktivitas penting:

- User login.
- User logout jika memungkinkan.
- User membuka kamera live.
- User membuka halaman kelas.
- Admin melakukan perubahan data penting.

Data log minimal:

- User id.
- Action.
- Camera id jika relevan.
- Metadata JSON opsional.
- Timestamp.

## 6. Kebutuhan Non-Fungsional

### 6.1 Keamanan

- Gunakan Supabase Auth untuk autentikasi.
- Gunakan Next.js Middleware untuk proteksi route.
- Gunakan Supabase RLS untuk proteksi data.
- Parent hanya dapat query kamera yang terhubung ke kelasnya.
- Service role key hanya digunakan di server environment.
- Jangan expose RTSP URL asli ke browser.
- Tunnel hanya mengekspos endpoint go2rtc yang dibutuhkan.

### 6.2 Performa

- Admin monitoring menggunakan snapshot JPEG.
- Live stream hanya dimuat saat user membuka detail kamera atau kelas.
- Gunakan lazy loading untuk player kamera.
- Hindari menampilkan 18 live stream secara bersamaan untuk pengguna umum.
- Gunakan caching ringan untuk metadata kamera dan kelas.

### 6.3 Reliability

- Jika kamera offline, UI menampilkan status offline atau gagal memuat.
- Jika tunnel tidak tersedia, UI menampilkan pesan error yang jelas.
- Aplikasi tetap dapat login dan melihat metadata walau stream lokal sedang mati.

### 6.4 Auditability

- Aktivitas akses kamera harus tersimpan di `activity_logs`.
- Admin dapat memfilter log berdasarkan user, kamera, action, dan tanggal.

## 7. Struktur Route Aplikasi

```text
/login
/unauthorized

/admin
/admin/users
/admin/classes
/admin/cameras
/admin/mapping
/admin/monitoring
/admin/logs

/principal
/principal/classes
/principal/classes/[classId]

/parent
/parent/cameras
/parent/classes/[classId]
```

## 8. Database Utama

Tabel utama:

- `profiles`
- `classes`
- `cameras`
- `class_cameras`
- `user_classes`
- `activity_logs`

Relasi:

- Satu class dapat memiliki banyak cameras.
- Satu camera dapat dipakai oleh banyak classes.
- Satu parent dapat terhubung ke satu atau banyak classes.
- Satu user dapat memiliki banyak activity logs.

## 9. Acceptance Criteria

### Admin

- Admin dapat login dan masuk ke dashboard admin.
- Admin dapat membuat user, kelas, kamera, dan mapping.
- Admin dapat melihat semua kamera dalam mode snapshot.
- Admin dapat melihat log aktivitas.

### Kepala Sekolah

- Kepala sekolah dapat login dan melihat semua kelas.
- Kepala sekolah dapat membuka live view berdasarkan kelas.
- Kepala sekolah tidak dapat mengakses route admin.

### Orang Tua

- Orang tua dapat login dan melihat kamera kelas anak.
- Orang tua tidak dapat melihat kamera kelas lain.
- RLS tetap memblokir data tidak sah meskipun client dimodifikasi.

### Security

- User tanpa login tidak bisa mengakses dashboard.
- Role salah diarahkan ke unauthorized.
- Service role key tidak pernah muncul di bundle frontend.

## 10. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Tunnel go2rtc down | Live CCTV tidak tampil | Tampilkan status error dan retry |
| Bandwidth tinggi | Koneksi sekolah lambat | Snapshot untuk monitoring admin |
| Salah konfigurasi RLS | Data bocor | Test RLS dengan user parent berbeda |
| Service key terekspos | Keamanan database kritis | Service key hanya di server env |
| Browser tidak mendukung WebRTC tertentu | Stream gagal | Sediakan fallback HLS |

