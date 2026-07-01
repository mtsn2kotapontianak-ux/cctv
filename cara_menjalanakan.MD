# Cara Menjalankan - Live CCTV Web Portal Sekolah

Dokumen ini menjelaskan cara konfigurasi lokal, Supabase, Netlify, go2rtc, dan Cloudflare Tunnel.

## 1. Prasyarat

Software yang dibutuhkan:

- Node.js LTS.
- npm atau pnpm.
- Akun Supabase.
- Akun Netlify.
- Akun Cloudflare.
- Linux PC lokal di sekolah.
- go2rtc di Linux PC.
- Akses RTSP ke kamera EZVIZ.

## 2. Menjalankan Project Lokal

Install dependency:

```bash
npm install
```

Buat file environment:

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL=https://cctv-sekolah.example.com
GO2RTC_INTERNAL_BASE_URL=http://localhost:1984
ACTIVITY_LOG_ENABLED=true
```

Jalankan development server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## 3. Konfigurasi Supabase

### 3.1 Buat Project Supabase

1. Login ke Supabase.
2. Buat project baru.
3. Simpan:
   - Project URL.
   - Anon public key.
   - Service role key.

Lokasi key:

```text
Project Settings -> API
```

### 3.2 Jalankan SQL Schema

Masuk ke:

```text
Supabase Dashboard -> SQL Editor
```

Jalankan migration schema:

1. Enum role.
2. Tabel `profiles`.
3. Tabel `classes`.
4. Tabel `cameras`.
5. Tabel `class_cameras`.
6. Tabel `user_classes`.
7. Tabel `activity_logs`.
8. Function helper role.
9. Trigger updated_at.
10. Index.

Setelah schema berhasil, jalankan migration RLS.

### 3.3 Aktifkan Authentication

Masuk ke:

```text
Authentication -> Providers
```

Aktifkan Email provider.

Untuk fase awal:

- Gunakan email dan password.
- Matikan public signup jika semua user dibuat oleh admin.

Pengaturan yang disarankan:

```text
Authentication -> Providers -> Email
Enable Email provider: ON
Confirm email: OFF untuk testing, ON untuk production jika dibutuhkan
```

### 3.4 Buat User Admin Pertama

Opsi 1: Melalui Supabase Dashboard.

1. Masuk ke `Authentication -> Users`.
2. Klik `Add user`.
3. Isi email dan password admin.
4. Copy user id.
5. Masuk ke SQL Editor.
6. Insert profile admin:

```sql
insert into public.profiles (id, nama, role)
values ('AUTH_USER_ID_ADMIN', 'Admin Sekolah', 'admin');
```

Opsi 2: Melalui fitur create user di aplikasi setelah endpoint admin tersedia.

### 3.5 Seed Data Awal

Contoh class:

```sql
insert into public.classes (nama_kelas)
values
  ('Kelas 1A'),
  ('Kelas 1B'),
  ('Kelas 2A');
```

Contoh camera:

```sql
insert into public.cameras (
  nama_kamera,
  source_name,
  tunnel_url,
  snapshot_url,
  deskripsi,
  is_active
)
values
(
  'CCTV Kelas 1A Depan',
  'kelas-1a-depan',
  'https://cctv-sekolah.example.com/stream.html?src=kelas-1a-depan',
  'https://cctv-sekolah.example.com/api/frame.jpeg?src=kelas-1a-depan',
  'Kamera depan kelas 1A',
  true
);
```

Mapping class-camera:

```sql
insert into public.class_cameras (class_id, camera_id)
select cl.id, ca.id
from public.classes cl, public.cameras ca
where cl.nama_kelas = 'Kelas 1A'
and ca.source_name = 'kelas-1a-depan';
```

Mapping parent-class:

```sql
insert into public.user_classes (user_id, class_id)
select p.id, cl.id
from public.profiles p, public.classes cl
where p.nama = 'Nama Orang Tua'
and cl.nama_kelas = 'Kelas 1A';
```

## 4. Konfigurasi go2rtc di Linux PC

### 4.1 Install go2rtc

Ikuti dokumentasi resmi go2rtc sesuai OS Linux yang digunakan.

Contoh struktur:

```text
/opt/go2rtc/
  go2rtc
  go2rtc.yaml
```

### 4.2 Contoh Konfigurasi go2rtc

File:

```text
/opt/go2rtc/go2rtc.yaml
```

Contoh:

```yaml
api:
  listen: ":1984"

webrtc:
  listen: ":8555"

streams:
  kelas-1a-depan:
    - rtsp://username:password@192.168.1.101:554/stream1

  kelas-1a-belakang:
    - rtsp://username:password@192.168.1.102:554/stream1

  kelas-1b-depan:
    - rtsp://username:password@192.168.1.103:554/stream1
```

Catatan:

- `source_name` di database harus sama dengan nama stream di `go2rtc.yaml`.
- Jangan memasukkan RTSP URL asli ke database web jika tidak diperlukan.
- Jangan tampilkan username/password kamera ke client.

### 4.3 Jalankan go2rtc

Contoh manual:

```bash
cd /opt/go2rtc
./go2rtc -config go2rtc.yaml
```

Contoh systemd service:

```ini
[Unit]
Description=go2rtc CCTV Streaming
After=network.target

[Service]
WorkingDirectory=/opt/go2rtc
ExecStart=/opt/go2rtc/go2rtc -config /opt/go2rtc/go2rtc.yaml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable go2rtc
sudo systemctl start go2rtc
sudo systemctl status go2rtc
```

### 4.4 Test go2rtc Lokal

Buka dari browser di jaringan lokal:

```text
http://IP_LINUX_PC:1984
```

Test snapshot:

```text
http://IP_LINUX_PC:1984/api/frame.jpeg?src=kelas-1a-depan
```

Test stream:

```text
http://IP_LINUX_PC:1984/stream.html?src=kelas-1a-depan
```

## 5. Konfigurasi Cloudflare Tunnel

### 5.1 Install cloudflared

Install `cloudflared` di Linux PC yang sama dengan go2rtc atau server lokal yang dapat mengakses go2rtc.

Login:

```bash
cloudflared tunnel login
```

Buat tunnel:

```bash
cloudflared tunnel create cctv-sekolah
```

Buat DNS route:

```bash
cloudflared tunnel route dns cctv-sekolah cctv-sekolah.example.com
```

### 5.2 Konfigurasi Tunnel

File contoh:

```text
~/.cloudflared/config.yml
```

Isi:

```yaml
tunnel: TUNNEL_ID
credentials-file: /home/USER/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: cctv-sekolah.example.com
    service: http://localhost:1984
  - service: http_status:404
```

Jalankan tunnel:

```bash
cloudflared tunnel run cctv-sekolah
```

Install sebagai service:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### 5.3 Test Tunnel

Buka:

```text
https://cctv-sekolah.example.com
```

Test snapshot:

```text
https://cctv-sekolah.example.com/api/frame.jpeg?src=kelas-1a-depan
```

Test stream:

```text
https://cctv-sekolah.example.com/stream.html?src=kelas-1a-depan
```

Jika endpoint ini berhasil, masukkan domain tersebut ke environment variable:

```env
NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL=https://cctv-sekolah.example.com
```

## 6. Konfigurasi Netlify

### 6.1 Hubungkan Repository

1. Login ke Netlify.
2. Klik `Add new site`.
3. Pilih repository GitHub/GitLab/Bitbucket.
4. Pilih project Next.js.

### 6.2 Build Settings

Gunakan:

```text
Build command: npm run build
Publish directory: .next
```

Untuk Next.js di Netlify, pastikan plugin Next.js aktif. Biasanya Netlify mendeteksi otomatis.

Jika perlu tambahkan `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 6.3 Environment Variables Netlify

Masuk ke:

```text
Site configuration -> Environment variables
```

Tambahkan:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL=https://cctv-sekolah.example.com
GO2RTC_INTERNAL_BASE_URL=https://cctv-sekolah.example.com
ACTIVITY_LOG_ENABLED=true
```

Penting:

- `SUPABASE_SERVICE_ROLE_KEY` jangan pernah diberi prefix `NEXT_PUBLIC_`.
- Jangan print environment variable sensitif ke console client.

### 6.4 Supabase Auth Redirect URL

Masuk ke Supabase:

```text
Authentication -> URL Configuration
```

Set:

```text
Site URL: https://nama-site.netlify.app
```

Tambahkan Redirect URLs:

```text
https://nama-site.netlify.app/**
http://localhost:3000/**
```

Jika memakai custom domain:

```text
https://portal-cctv.sekolah.sch.id/**
```

## 7. Koneksi Aplikasi ke Tunnel

Database `cameras` harus memiliki data yang sesuai dengan go2rtc.

Contoh:

```text
source_name: kelas-1a-depan
tunnel_url: https://cctv-sekolah.example.com/stream.html?src=kelas-1a-depan
snapshot_url: https://cctv-sekolah.example.com/api/frame.jpeg?src=kelas-1a-depan
```

Jika aplikasi membangun URL otomatis, cukup simpan:

```text
source_name: kelas-1a-depan
NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL=https://cctv-sekolah.example.com
```

Lalu aplikasi membentuk:

```text
Live:     {BASE_URL}/stream.html?src={source_name}
Snapshot: {BASE_URL}/api/frame.jpeg?src={source_name}
```

## 8. Checklist Verifikasi

### 8.1 Supabase

- Project URL dan anon key benar.
- Service role key hanya ada di server environment.
- Tabel sudah dibuat.
- RLS sudah aktif.
- User admin pertama punya row di `profiles`.
- Parent punya mapping di `user_classes`.
- Kamera punya mapping di `class_cameras`.

### 8.2 go2rtc

- go2rtc service aktif.
- Stream RTSP kamera berhasil dibaca.
- Snapshot lokal berhasil.
- Stream lokal berhasil.

### 8.3 Cloudflare Tunnel

- Tunnel service aktif.
- Domain tunnel bisa dibuka dari internet.
- Snapshot via domain tunnel berhasil.
- Stream via domain tunnel berhasil.

### 8.4 Aplikasi Web

- Login admin berhasil.
- Login principal berhasil.
- Login parent berhasil.
- Role salah diarahkan ke unauthorized.
- Admin monitoring memakai snapshot.
- Parent hanya melihat kamera kelas anak.
- Activity log tercatat.

### 8.5 Netlify

- Build sukses.
- Environment variables lengkap.
- Supabase redirect URL benar.
- Halaman production dapat login.
- Production dapat mengakses tunnel go2rtc.

## 9. Troubleshooting

### 9.1 Login berhasil tetapi dashboard error

Kemungkinan:

- Row `profiles` belum dibuat.
- Role kosong atau tidak valid.
- RLS terlalu ketat.

Cek:

```sql
select * from public.profiles;
```

### 9.2 Parent tidak melihat kamera

Kemungkinan:

- Parent belum terhubung ke class di `user_classes`.
- Class belum terhubung ke camera di `class_cameras`.
- `source_name` kamera salah.

Cek:

```sql
select
  p.nama,
  cl.nama_kelas,
  ca.nama_kamera,
  ca.source_name
from public.profiles p
join public.user_classes uc on uc.user_id = p.id
join public.classes cl on cl.id = uc.class_id
join public.class_cameras cc on cc.class_id = cl.id
join public.cameras ca on ca.id = cc.camera_id;
```

### 9.3 Snapshot tidak tampil

Kemungkinan:

- Cloudflare Tunnel mati.
- go2rtc mati.
- Nama `src` tidak sama dengan konfigurasi go2rtc.
- Kamera RTSP offline.

Test langsung:

```text
https://cctv-sekolah.example.com/api/frame.jpeg?src=SOURCE_NAME
```

### 9.4 Live stream tidak tampil tetapi snapshot tampil

Kemungkinan:

- WebRTC terblokir jaringan.
- Browser tidak cocok dengan mode stream.
- Perlu fallback HLS.

Solusi:

- Coba HLS endpoint.
- Pastikan player punya fallback.
- Cek console browser.

### 9.5 Build Netlify gagal karena Supabase key

Kemungkinan:

- Environment variable belum diisi.
- Nama variable berbeda.
- Service role key dipakai di client component.

Solusi:

- Pastikan service role hanya digunakan di server action, route handler, atau server component.
- Jangan import `lib/supabase/admin.ts` dari client component.

