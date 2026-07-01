# Tahap Prompt - Pembuatan Live CCTV Web Portal

Dokumen ini berisi rangkaian prompt bertahap untuk diberikan ke Agentic AI pembuat kode. Gunakan secara urut agar implementasi lebih rapi dan mudah diverifikasi.

## Prompt 1 - Inisialisasi Project

```text
Anda adalah senior full-stack engineer. Buat project Next.js App Router untuk Live CCTV Web Portal Sekolah.

Gunakan stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth dan PostgreSQL
- Deployment target Netlify

Buat struktur awal:
- app routes untuk login, unauthorized, admin, principal, parent
- components dasar layout
- lib/supabase/client.ts
- lib/supabase/server.ts
- middleware.ts placeholder
- .env.example

Jangan buat fitur kompleks dulu. Fokus pada struktur project yang bersih, TypeScript strict, dan layout dasar yang siap dikembangkan.
```

Output yang diharapkan:

- Project bisa dijalankan dengan `npm run dev`.
- Route dasar tersedia.
- Tidak ada error TypeScript.

## Prompt 2 - Database Schema Supabase

```text
Buat file SQL migration untuk Supabase PostgreSQL berdasarkan schema berikut:

Tables:
- profiles
- classes
- cameras
- class_cameras
- user_classes
- activity_logs

Role enum:
- admin
- principal
- parent

Tambahkan:
- primary key dan foreign key
- created_at dan updated_at
- index untuk foreign key
- trigger updated_at
- helper function current_user_role(), is_admin(), is_principal()

Jangan aktifkan RLS dulu pada prompt ini. Pastikan SQL dapat dijalankan di Supabase SQL Editor.
```

Output yang diharapkan:

- File migration SQL.
- Penjelasan singkat cara menjalankan SQL di Supabase.

## Prompt 3 - Supabase Auth dan Profile Sync

```text
Implementasikan autentikasi Supabase:

- Halaman login dengan email dan password.
- Logout.
- Server-side session handling untuk Next.js App Router.
- Setelah login, redirect berdasarkan role dari table profiles:
  - admin ke /admin
  - principal ke /principal
  - parent ke /parent
- Jika profile belum ada, tampilkan error yang jelas.

Buat helper:
- getCurrentUser()
- getCurrentProfile()
- requireAuth()
- redirectByRole()

Pastikan tidak ada service role key di client bundle.
```

Output yang diharapkan:

- Login berfungsi.
- Redirect role berfungsi.
- Logout berfungsi.

## Prompt 4 - Middleware RBAC

```text
Implementasikan Next.js middleware untuk RBAC:

Rules:
- User tanpa session yang membuka /admin, /principal, atau /parent diarahkan ke /login.
- /admin hanya untuk role admin.
- /principal hanya untuk role principal.
- /parent hanya untuk role parent.
- Role salah diarahkan ke /unauthorized.

Gunakan Supabase server client yang kompatibel dengan middleware.
Jika role belum tersedia di JWT, ambil dari table profiles dengan cara yang aman.

Tambahkan test manual checklist pada README atau komentar dokumentasi.
```

Output yang diharapkan:

- Route terlindungi.
- User tidak bisa membuka dashboard role lain.

## Prompt 5 - RLS Policies

```text
Buat migration SQL untuk mengaktifkan Supabase Row Level Security.

Policy wajib:
- Admin bisa read/manage semua data master.
- Principal bisa read semua classes, cameras, dan class_cameras.
- Parent hanya bisa read classes yang terhubung melalui user_classes.
- Parent hanya bisa read cameras yang terhubung ke class mereka melalui class_cameras.
- User hanya bisa read profile sendiri, kecuali admin.
- Activity logs hanya bisa dibaca admin.
- User boleh insert log miliknya sendiri.

Pastikan policy tetap aman jika client dimodifikasi.
Sertakan query manual untuk menguji parent A tidak dapat melihat kamera parent B.
```

Output yang diharapkan:

- RLS aktif dan aman.
- Query parent dibatasi oleh junction table.

## Prompt 6 - Admin CRUD Users, Classes, Cameras

```text
Buat halaman admin:

- /admin/users
- /admin/classes
- /admin/cameras

Fitur:
- List data.
- Create data.
- Edit data.
- Delete atau deactivate jika lebih aman.
- Loading state.
- Empty state.
- Error state.

Untuk users:
- Gunakan server route/action dengan Supabase service role untuk membuat Supabase Auth user.
- Setelah auth user dibuat, buat row di profiles.
- Admin dapat memilih role.

Untuk cameras:
- Field: nama_kamera, source_name, tunnel_url, snapshot_url, deskripsi, is_active.

Pastikan service role key hanya digunakan server-side.
```

Output yang diharapkan:

- Admin dapat mengelola data master.
- UI sederhana dan operasional.

## Prompt 7 - Admin Mapping Kelas, Kamera, dan Orang Tua

```text
Buat halaman /admin/mapping untuk mengatur:

- Kamera mana saja yang terhubung ke class tertentu.
- Orang tua mana saja yang terhubung ke class tertentu.

Gunakan relasi:
- class_cameras
- user_classes

UI yang diminta:
- Pilih kelas.
- Multi-select kamera.
- Multi-select user parent.
- Tombol simpan.
- Tampilkan status berhasil/gagal.

Pastikan hanya role admin yang bisa melakukan perubahan mapping.
```

Output yang diharapkan:

- Mapping class-camera berhasil.
- Mapping parent-class berhasil.
- Parent langsung mendapatkan akses sesuai mapping.

## Prompt 8 - Live Camera Player

```text
Implementasikan komponen live camera player untuk go2rtc.

Kebutuhan:
- Menerima camera object dari database.
- Menggunakan tunnel_url atau membangun URL dari base URL + source_name.
- WebRTC sebagai mode utama.
- HLS fallback jika WebRTC gagal.
- Loading state.
- Error state jika stream gagal.
- Tombol retry.

Gunakan route:
- /principal/classes/[classId]
- /parent/classes/[classId]

Principal bisa melihat semua kamera class.
Parent hanya bisa melihat kamera class yang diizinkan oleh RLS.

Tambahkan activity log action camera.view_live saat kamera dibuka.
```

Output yang diharapkan:

- Live stream tampil untuk kamera yang valid.
- Parent tidak bisa melihat kamera yang tidak diizinkan.

## Prompt 9 - Admin Snapshot Monitoring

```text
Buat halaman /admin/monitoring untuk menampilkan semua kamera dalam mode snapshot JPEG.

Kebutuhan:
- Ambil semua cameras aktif.
- Tampilkan dalam grid responsif.
- Jangan gunakan live WebRTC untuk grid ini.
- Gunakan endpoint snapshot go2rtc:
  /api/frame.jpeg?src={source_name}
- Tambahkan cache buster timestamp.
- Auto refresh default 10 detik.
- Refresh interval bisa diubah oleh admin.
- Berikan error state per kamera jika snapshot gagal.

Tujuan utama: hemat bandwidth saat admin memantau semua kamera.
```

Output yang diharapkan:

- Semua kamera tampil sebagai snapshot.
- Browser tidak membuka 18 live stream bersamaan.

## Prompt 10 - Activity Logs

```text
Implementasikan activity logging.

Buat helper:
- logActivity(action, cameraId?, metadata?)

Action:
- auth.login
- auth.logout
- camera.view_live
- camera.view_snapshot
- class.open
- admin.user.create
- admin.user.update
- admin.camera.create
- admin.camera.update
- admin.mapping.update

Buat halaman /admin/logs:
- Tabel log.
- Filter user.
- Filter action.
- Filter camera.
- Filter tanggal.
- Pagination.

Pastikan hanya admin yang bisa membaca semua log.
```

Output yang diharapkan:

- Aktivitas penting tercatat.
- Admin dapat audit akses kamera.

## Prompt 11 - Dashboard Role

```text
Rapikan dashboard untuk setiap role.

Admin dashboard:
- Jumlah user.
- Jumlah kelas.
- Jumlah kamera aktif.
- Shortcut ke monitoring dan logs.

Principal dashboard:
- Jumlah kelas.
- Shortcut ke daftar kelas.

Parent dashboard:
- Welcome screen.
- Daftar kelas anak.
- Shortcut ke kamera yang diizinkan.

Desain harus sederhana, rapi, dan cocok untuk aplikasi operasional sekolah.
Jangan membuat landing page marketing.
```

Output yang diharapkan:

- Tiap role punya dashboard yang jelas.
- Navigasi mudah digunakan.

## Prompt 12 - Netlify Deployment

```text
Siapkan project untuk deployment ke Netlify.

Kebutuhan:
- Tambahkan netlify.toml jika diperlukan.
- Pastikan Next.js App Router berjalan di Netlify.
- Dokumentasikan environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL
  - GO2RTC_INTERNAL_BASE_URL
  - ACTIVITY_LOG_ENABLED
- Pastikan build command dan publish directory benar.
- Jalankan npm run build dan perbaiki error.

Jangan expose service role key ke client.
```

Output yang diharapkan:

- Build sukses.
- Siap deploy ke Netlify.

## Prompt 13 - Hardening dan QA

```text
Lakukan audit akhir aplikasi.

Periksa:
- Tidak ada service role key di client.
- Middleware RBAC bekerja.
- RLS bekerja.
- Parent tidak bisa melihat kamera kelas lain.
- Admin monitoring memakai snapshot, bukan live stream.
- Error stream ditangani dengan baik.
- Build production sukses.
- UI mobile dan desktop tidak overlap.

Buat checklist QA dan catat hasilnya.
```

Output yang diharapkan:

- Aplikasi siap uji coba di lingkungan sekolah.
- Checklist QA tersedia.

