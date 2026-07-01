# Netlify Deployment

## Build Settings

Gunakan pengaturan berikut di Netlify:

```text
Build command: npm run build
Publish directory: .next
```

File `netlify.toml` sudah tersedia:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Environment Variables

Tambahkan environment variables berikut di Netlify:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL=
GO2RTC_INTERNAL_BASE_URL=
ACTIVITY_LOG_ENABLED=true
```

Opsional:

```env
NEXT_PUBLIC_APP_NAME="CCTV Digital Swanda"
```

Catatan keamanan:

- `SUPABASE_SERVICE_ROLE_KEY` harus ada di Netlify environment variable, tetapi jangan pernah diberi prefix `NEXT_PUBLIC_`.
- Service role key hanya digunakan oleh server actions, server components, dan helper `lib/supabase/admin.ts`.
- Jangan menaruh service role key di kode, browser, atau konfigurasi client.

## Supabase Auth URL

Di Supabase Dashboard, buka:

```text
Authentication -> URL Configuration
```

Set:

```text
Site URL: https://NAMA_SITE_NETLIFY.netlify.app
```

Tambahkan redirect URL:

```text
https://NAMA_SITE_NETLIFY.netlify.app/**
http://localhost:3000/**
```

Jika memakai custom domain:

```text
https://portal-cctv.domain-sekolah.sch.id/**
```

## go2rtc / Cloudflare Tunnel

`NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL` harus mengarah ke domain tunnel publik go2rtc:

```env
NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL=https://cctv-sekolah.example.com
```

Endpoint yang harus bisa dibuka dari browser:

```text
https://cctv-sekolah.example.com/stream.html?src=SOURCE_NAME
https://cctv-sekolah.example.com/api/stream.m3u8?src=SOURCE_NAME
https://cctv-sekolah.example.com/api/frame.jpeg?src=SOURCE_NAME
```

## Deploy Checklist

1. Jalankan migration Supabase:
   - `202607010001_initial_schema.sql`
   - `202607010002_enable_rls.sql`
2. Buat admin pertama di Supabase Auth dan `public.profiles`.
3. Isi semua environment variables di Netlify.
4. Pastikan Cloudflare Tunnel go2rtc aktif.
5. Jalankan deploy dari Netlify.
6. Login sebagai admin dan uji `/admin`, `/admin/monitoring`, dan `/admin/logs`.

