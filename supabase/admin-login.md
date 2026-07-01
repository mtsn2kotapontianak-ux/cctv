# Informasi Login Admin Awal

Gunakan kredensial awal berikut untuk akun admin pertama:

```text
Email: admin@swanda.sch.id
Password: AdminSwanda#2026
```

Penting: kredensial ini belum otomatis dibuat di Supabase. Buat user admin pertama dari Supabase Dashboard.

## Cara Membuat Admin Pertama

1. Buka Supabase Dashboard.
2. Masuk ke `Authentication -> Users`.
3. Klik `Add user`.
4. Isi:

```text
Email: admin@swanda.sch.id
Password: AdminSwanda#2026
Auto Confirm User: aktif
```

5. Setelah user dibuat, copy `User UID`.
6. Buka `SQL Editor`.
7. Jalankan SQL berikut dengan mengganti `USER_UID_DARI_SUPABASE`:

```sql
insert into public.profiles (id, nama, role)
values ('USER_UID_DARI_SUPABASE', 'Admin Swanda', 'admin')
on conflict (id) do update
set
  nama = excluded.nama,
  role = excluded.role,
  updated_at = now();
```

Setelah itu login ke aplikasi menggunakan:

```text
Email: admin@swanda.sch.id
Password: AdminSwanda#2026
```

Ganti password sebelum production.
