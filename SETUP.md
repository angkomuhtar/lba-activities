# Setup

Panduan langkah demi langkah untuk menyambungkan aplikasi ke database Supabase (via Prisma) dan deploy ke Vercel.

## Prasyarat env

Buat file `.env.local` dari `.env.example`. Variabel yang dibutuhkan:

| Variabel | Keterangan |
|----------|-----------|
| `DATABASE_URL` | Koneksi Postgres Supabase. Supabase → Settings → Database → Connection string (URI, **Direct connection**), ganti `[YOUR-PASSWORD]` |
| `SESSION_SECRET` | untuk menandatangani session cookie. Generate: `openssl rand -base64 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NAME` | (opsional) untuk seeder |

> Aplikasi kini memakai **Prisma** untuk schema & query — tidak lagi `supabase-js`.

## 1. Setup database (Prisma + Supabase)

Login memakai **username + password** yang disimpan di tabel `users` (dikelola Prisma).

```bash
npm run db:migrate   # di dev: buat & terapkan migrasi dari prisma/schema.prisma
npm run db:generate  # generate Prisma Client
```

Untuk production, gunakan:

```bash
npm run db:deploy    # terapkan migrasi yang sudah ada (tanpa prompt)
```

### Seeder Super Admin

```bash
npm run db:seed
```

Default: username `admin`, password `password`. Bisa diubah lewat env `ADMIN_USERNAME` / `ADMIN_PASSWORD` di `.env.local`.

> Penting: setelah berhasil login pertama, segera ganti password (menu Pengaturan).

> Panel database di browser: `npm run db:studio`.

## 2. Deploy ke Vercel

1. Push project ke GitHub.
2. Buka [vercel.com](https://vercel.com), klik **New Project**, lalu import repo.
3. Tambahkan environmental variables berikut di **Settings → Environment Variables**:
   - `DATABASE_URL` (pakai direct connection untuk produksi)
   - `SESSION_SECRET`
4. Deploy.
5. Jalankan migrasi di produksi (Build Command atau sesudah deploy): `npx prisma migrate deploy`

> Gunakan project Supabase terpisah untuk Production & Development dengan mengisi env berbeda di Vercel (Production / Preview) dan `.env.local` untuk lokal.

## Role & Permission

Didefinisikan di `src/lib/permissions.ts`.

| Role | Permission |
|------|-----------|
| `superadmin` | `dashboard.view`, `user.view`, `user.manage`, `settings.manage` |
| `admin` | `dashboard.view`, `user.view`, `user.manage` |
| `user` | `dashboard.view` |

Aturan yang diterapkan:
- Halaman **Kelola User** (`/users`) hanya tampil/bisa diakses oleh role admin & superadmin.
- Super admin dapat mengubah/menghapus semua akun termasuk sesama super admin; admin biasa tidak dapat mengubah/menghapus super admin.
- Seseorang tidak dapat menghapus akunnya sendiri.

## Struktur file auth

| File | Peran |
|------|-------|
| `src/proxy.ts` | Guard global: arahkan user yang belum login ke `/login` |
| `src/lib/prisma.ts` | Prisma Client singleton (server-only) |
| `src/lib/auth.ts` | Session (jose), bcrypt, query user |
| `src/lib/permissions.ts` | Definisi role & permission |
| `src/app/actions/auth.ts` | Server actions: login, logout, createUser, updateUser, deleteUser |
| `src/app/(auth)/login` | Halaman masuk (username + password) |
| `src/app/(dashboard)` | Area dashboard yang dilindungi auth |
| `src/app/(dashboard)/users` | Halaman kelola user (tambah + hapus) |
| `prisma/schema.prisma` | Skema database (model + enum Role) |
| `scripts/seed-admin.ts` | Seeder superadmin |