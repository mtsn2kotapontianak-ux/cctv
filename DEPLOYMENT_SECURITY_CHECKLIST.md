# Deployment Security Checklist

Gunakan checklist ini sebelum deploy production Netlify.

## Netlify

- Set environment variables lewat Netlify UI, bukan `netlify.toml`.
- Wajib ada:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL`
  - `GO2RTC_INTERNAL_BASE_URL`
  - `ACTIVITY_LOG_ENABLED=true`
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` tidak memakai prefix `NEXT_PUBLIC_`.
- Build command: `npm run build`.
- Publish directory: `.next`.
- Setelah deploy, cek response headers:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `X-Frame-Options`

## Supabase

- Jalankan semua migration di folder `supabase/migrations` secara berurutan.
- Pastikan migration `202607010004_profile_deactivation_hardening.sql` sudah jalan.
- Jalankan Supabase Security Advisor dan Performance Advisor.
- Pastikan RLS aktif untuk:
  - `profiles`
  - `classes`
  - `cameras`
  - `class_cameras`
  - `user_classes`
  - `activity_logs`
- Uji akun parent A tidak bisa membaca kamera/kind kelas parent B.
- Uji akun nonaktif tidak bisa membuka `/parent`, `/principal`, `/admin`.
- Uji akun nonaktif tidak bisa query `classes`, `cameras`, dan `user_classes` dari client.

## go2rtc / Cloudflare Tunnel / Caddy

- Gunakan HTTPS untuk endpoint publik go2rtc.
- Jangan expose RTSP URL atau credential kamera ke browser.
- Lindungi tunnel dengan salah satu:
  - Cloudflare Access,
  - auth di Caddy,
  - allowlist jaringan/VPN,
  - signed/protected reverse proxy.
- Pastikan endpoint berikut tidak terbuka tanpa proteksi tambahan jika source name mudah ditebak:
  - `/stream.html?src=...`
  - `/api/frame.jpeg?src=...`
  - `/api/stream.m3u8?src=...`
- Gunakan `source_name` yang tidak mudah ditebak.
- Pastikan CORS hanya mengizinkan domain Netlify production jika Caddy/go2rtc dikonfigurasi manual.

## Manual QA Production

- Login admin, principal, dan parent.
- Buka route role lain dan pastikan masuk `/unauthorized`.
- Admin bisa create/update user, reset password, nonaktifkan, dan aktifkan user.
- User nonaktif gagal login dengan pesan jelas.
- Parent hanya melihat kelas dan kamera miliknya.
- Admin monitoring memakai snapshot, bukan 18 live WebRTC sekaligus.
- Snapshot dan live stream bisa dibuka dari jaringan luar sekolah.
- Activity log mencatat login/logout/view live/snapshot/admin update.

## Operational Notes

- Jangan hapus user secara permanen kecuali benar-benar perlu. Gunakan nonaktifkan agar audit trail tetap aman.
- Jangan simpan password, token, RTSP credential, atau service key di activity log.
- Review `activity_logs` berkala dan tentukan retensi, misalnya 90 atau 180 hari.
- Simpan minimal dua akun admin aktif untuk recovery.
