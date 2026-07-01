# QA Checklist

## Build dan Deployment

- [x] `npm run typecheck` sukses.
- [x] `npm run build` sukses.
- [x] `netlify.toml` tersedia dengan build command `npm run build`.
- [x] Publish directory Netlify diset ke `.next`.
- [x] Plugin `@netlify/plugin-nextjs` tersedia di dependency.

## Environment dan Secret

- [x] `.env.example` mendokumentasikan Supabase, go2rtc, dan activity log env.
- [x] `SUPABASE_SERVICE_ROLE_KEY` tidak memakai prefix `NEXT_PUBLIC_`.
- [x] Helper service role berada di file server-only `lib/supabase/admin.ts`.
- [x] Tidak ada import `createAdminClient()` dari client component.
- [x] Secret service role dari `.env.local` tidak ditemukan di output `.next`.

## Auth dan RBAC

- [x] Login menggunakan Supabase Auth.
- [x] Redirect role:
  - `admin` -> `/admin`
  - `principal` -> `/principal`
  - `parent` -> `/parent`
- [x] Middleware melindungi prefix:
  - `/admin` hanya role `admin`
  - `/principal` hanya role `principal`
  - `/parent` hanya role `parent`
- [x] User tanpa session diarahkan ke `/login`.
- [x] Role salah diarahkan ke `/unauthorized`.

## Supabase RLS

- [x] Migration RLS tersedia di `supabase/migrations/202607010002_enable_rls.sql`.
- [x] Parent hanya bisa membaca kelas dari `user_classes`.
- [x] Parent hanya bisa membaca kamera dari relasi `user_classes` dan `class_cameras`.
- [x] Query manual isolasi parent tersedia di `supabase/rls-parent-access-test.sql`.
- [ ] Uji manual parent A tidak bisa melihat kamera parent B di Supabase SQL Editor.

## Admin

- [x] Admin bisa mengelola users.
- [x] Admin bisa mengelola classes.
- [x] Admin bisa mengelola cameras.
- [x] Admin bisa mengelola mapping class-camera dan parent-class.
- [x] Admin monitoring memakai snapshot JPEG, bukan WebRTC/HLS.
- [x] Admin bisa melihat activity logs dengan filter dan pagination.

## Principal

- [x] Principal dashboard menampilkan jumlah kelas.
- [x] Principal bisa membuka daftar kelas.
- [x] Principal bisa membuka live view kamera per kelas.

## Parent

- [x] Parent dashboard menampilkan welcome screen dan daftar kelas anak.
- [x] Parent kamera dibatasi oleh RLS.
- [x] Parent live view memakai route `/parent/classes/[classId]`.

## Streaming dan Error Handling

- [x] Live player memakai WebRTC sebagai mode utama.
- [x] Live player menyediakan HLS fallback.
- [x] Live player memiliki loading state.
- [x] Live player memiliki error state dan tombol retry.
- [x] Snapshot monitoring memiliki error state per kamera.
- [x] Snapshot monitoring memakai cache buster timestamp.

## UI

- [x] Dashboard role sederhana dan operasional.
- [x] Sidebar dan label utama memakai bahasa Indonesia.
- [x] Layout desktop dan mobile memakai grid responsif.
- [ ] Uji visual manual di browser untuk viewport mobile dan desktop dengan data nyata.

